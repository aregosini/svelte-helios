let MaxPointGraph = 60; // numro massimo di punti da visualizzare nel grafico
let loadNpoint = MaxPointGraph // numero di punti da caricare dal DB 
let simulateDataElettro = false; // simuliamo i dati?
let simulateDataSerra =false; // simuliamo i dati?
let realTime = true; // dobbiamo fare la fetch dei dati attuali?
let timeLaps = 5; // refresh ogni 2 secondi se non in simulaData
const apiUrl = 'https://www.heliosproject.it/sensori/get-data-grafici.php';
let pagina; // pagina 'elettro' o 'serra'
let grafici={}; //usato per nomi variabili e grafici
let updateStatoPagina   // funzione per aggiornare lo stato dell'elettrolizzatore e dei sensori della serra
let oneChart = true; // temp, ph e conducimetro rispettivamente nello stesso grafico?
let scalaGraficiAutomatica = false;
let allarme = new Audio('alarm.mp3');  // file per l'allarme

// dimensioni dei pallini nei grafici
let borderWidth = 1; // Thicker line
let pointRadius = 2; // Larger points

// Funzione per ottenegenerare numeri random come quelli ricevuti dal server
function genOra(secondi=timeLaps){
    const now = new Date();

    // Calcola la data e ora di t secondi fa
    const passato = new Date(now - secondi * 1000);
    const ora = `${passato.getHours()}:${passato.getMinutes()}:${passato.getSeconds()}`;
    return ora;
}	


function genValue(val,second){
    // genero un valore random attorno a y in base ad una percentuale del range ymax-ymin
    perc = 0.03; //5% di oscillazione intorno a y 
    let range = (val.ymax-val.ymin) * perc; 
    range = range * 100 // per evitare che sia con la virgola
    let ret = Math.random() * range / 100 + val.y;
    ret = ret.toFixed(2);
    return {"time":genOra(second),"value":ret}
}

function fetchDataSim(second=timeLaps) {
    let ret = {};

    Object.entries(grafici).forEach(([nome,val]) => {
        ret[nome] = [];
        for (let i=second; i>0; i--)
            ret[nome].push(genValue(val,i));
    })
    ret['pingElettro'] = [{"time":genOra(),"value":1}]
    return ret;
}

//async function fetchData(second=timeLaps) {
async function fetchData(second=timeLaps) {
    try {
        //console.log('GET: ',apiUrl+`?second=${second}&maxPoint=${MaxPointGraph}&pagina=${pagina}`,{ cache: 'no-store' });
        const response = await fetch(apiUrl+`?second=${second}&maxPoint=${MaxPointGraph}&pagina=${pagina}`,{ cache: 'no-store' });
        //const response = await fetch(apiUrl+`?data=2025-03-18&second=3600*3`,{ cache: 'no-store' });

        if (!response.ok) {
            throw new Error('Errore nel recupero dei dati');
        }
        const data = await response.json();
        return data;  // Assumiamo che i dati siano già nel formato corretto
    } catch (error) {
        console.error('Errore durante la richiesta dei dati:', error);
        return null;  // Ritorna un oggetto vuoto in caso di network error
    }
}

function doChart(nome, opt) {
    const ctx = document.getElementById(`chart-${nome}`);
    if (opt.label === undefined) opt.label = "";
    if (opt.dataset === undefined) opt.dataset = 0;

    const optChart = {
        type: 'line',
        data: {
            datasets: [{
                data: [],
                label: opt.label,
                borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
                backgroundColor: 'rgba(0, 123, 255, 0.1)', // Light fill color
                borderWidth: borderWidth, // Thicker line
                pointRadius: pointRadius, // Larger points
                pointBackgroundColor: '#007bff', // Blue points
                fill: true // Fill under the line
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: opt.descr,
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: 'Arial, sans-serif'
                    },
                    color: '#333' // Darker title color
                },
                legend: {
                    display: true, // Show legend
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12
                        },
                        color: '#555' // Subtle legend color
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark tooltip background
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 12 },
                    bodyColor: '#fff', // White text
                    borderColor: '#007bff', // Blue border
                    borderWidth: 1
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)' // Subtle grid lines
                    },
                    ticks: {
                        color: '#555', // Subtle tick color
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)' // Subtle grid lines
                    },
                    ticks: {
                        color: '#555', // Subtle tick color
                        font: {
                            size: 12
                        }
                    },
                    min: opt.ymin || 0,
                    max: opt.ymax || 100
                }
            }
        }
    };

    const chart = new Chart(ctx, optChart);
    return chart;
}

// ricevuti tutti i dati, fa una media a gruppi in modo da visualizzarne al massimo MaxPointGraph
function adjData(data){ 
    Object.entries(data).forEach(([nome,val]) => {
        let newdati = [];
        dimGruppo = Math.round(val.length / MaxPointGraph);
        //console.log('dimGruppo ',dimGruppo,' len ',val.length);
        let media = 0;
        let count = 0;
        for (let i=0; i< val.length; i++) { 
            let riga = val[i];
            media += Number.parseFloat(riga.value);
            count ++;
            //console.log('c ',count,'value: ',riga.value,' tempo:',riga.time,' m ',media)
            if (count >= dimGruppo || i==val.length-1){
                media = media / count;
                //console.log('m: ',media,' t:',riga.time)
                newdati.push({value:media,time: riga.time});
                count = 0;
                media = 0;
            }
        };
        data[nome] = newdati; // sostituiamo i nuovi dati compressi 
        //console.log('new len ',data[nome].length);    
        //console.log(data[nome]);       
    });
}

function isOggi(dataStringa) {
  let oggi = new Date();
  let giorno = String(oggi.getDate()).padStart(2, '0');
  let mese = String(oggi.getMonth() + 1).padStart(2, '0');
  let anno = oggi.getFullYear();

  let dataOggi = `${giorno}-${mese}-${anno}`;
  //console.log('oggi -',dataOggi,'- stringa -',dataStringa,'- esito ',dataStringa === dataOggi);

  return dataStringa === dataOggi;
}

function getViewportWidth() {
    return window.innerWidth;
}

// Funzione per aggiornare i grafici con nuovi dati
async function updateCharts(second = timeLaps) {
    if(getViewportWidth() < 768) {
        MaxPointGraph = 45; // Se la larghezza dello schermo è inferiore a 768px, mostra solo 20 punti
    } else {
        MaxPointGraph = 60; // Altrimenti, mostra 60 punti
    }
    let data = {};

    if (simulateDataElettro && pagina === 'elettro') {
        data = fetchDataSimElettro(second);
        adjData(data); // Comprimi i dati solo se simulati
    } else if (simulateDataSerra && pagina === 'serra') {
        data = fetchDataSimSerra(second);
        adjData(data); // Comprimi i dati solo se simulati
    } else {
        // Fetch dei dati reali dal server
        data = await fetchData(second);
    }
    if (data == null){
        console.log('network error');
        showLoader(true);
        return true;
    }
    updateStatoPagina(data);
    //console.log(data);

    Object.keys(grafici).forEach((nome) => {
        if (nome in data) {
            const grf  = grafici[nome];
            const chart = grf.chart;
            const ds    = grf.dataset || 0;
            const dati  = data[nome];

            // cambio data oppure non sono i dati di oggi? stampiamo la data
            if (dati[0].time.split(" ")[0] !== dati[dati.length-1].time.split(" ")[0] || !isOggi(dati[0].time.split(" ")[0])) // cambio data?
                precData = "";
            else
                precData = dati[0].time.split(" ")[0];
            
            //    console.log('precData ',precData);
            for (i=0; i<dati.length;i++){
                if (ds === 0) {
                    if (dati[i].time.split(" ")[0] !== precData){ // cambio data? visualizziamo la data
                        time = dati[i].time;
                        precData = dati[i].time.split(" ")[0];
                        //console.log("data ",time," -",precData,"-");
                    }
                    else 
                        time = dati[i].time.split(" ")[1]   // prende solo l'ora
                    chart.data.labels.push(time);
                }            
                chart.data.datasets[ds].data.push(dati[i].value);
            }
            
            // ci sono più di MaxPointGraph? togliamo i vecchi
            chart.data.labels.splice(0, chart.data.labels.length - MaxPointGraph);
            chart.data.datasets[ds]
                    .data.splice(0, chart.data.datasets[ds].data.length - MaxPointGraph);
        }
        // in tutti i casi aggiorniamo i grafici
        if (grafici[nome].chart.data.labels.length >= MaxPointGraph) {
            grafici[nome].chart.update('none');
        } else {
            grafici[nome].chart.update();
        }
    });
    return false;
}

function showLoader(netError=false){
    if (netError)
        msg = "Errore di connessione rete..."
    else
        msg = "Caricamento in corso..."

    document.getElementById('loader-text').innerText = msg;
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader(){
    document.getElementById('loader').style.display = 'none';
}

function fetchDataSimElettro(second = timeLaps) {
    if (!simulateDataElettro || pagina !== 'elettro') {
        return {}; // Non generare dati se la simulazione è disattivata o non siamo nella pagina Elettrolizzatore
    }

    let ret = {};
    Object.entries(grafici).forEach(([nome, val]) => {
        ret[nome] = [];
        for (let i = second; i > 0; i--) {
            ret[nome].push(genValue(val, i));
        }
    });
    ret['pingElettro'] = [{ "time": genOra(), "value": 1 }];
    return ret;
}

function fetchDataSimSerra(second = timeLaps) {
    if (!simulateDataSerra || pagina !== 'serra') {
        return {}; // Non generare dati se la simulazione è disattivata o non siamo nella pagina Serra
    }

    let ret = {};
    Object.entries(grafici).forEach(([nome, val]) => {
        ret[nome] = [];
        for (let i = second; i > 0; i--) {
            ret[nome].push(genValue(val, i));
        }
    });
    ret['pingSerra'] = [{ "time": genOra(), "value": 1 }];
    return ret;
}

function generateDescription(decision) {
    const chartsContainer = document.getElementById('big-card-interno');
    chartsContainer.innerHTML = ''; // Clear any existing content
    const wrapper2 = document.createElement('div');
    if (decision == 1) { // elettrolizzatore
        chartsContainer.classList.remove("box-serra"); // Rimuovi la classe "box-serra"
        chartsContainer.classList.add("box-elettro"); // Aggiungi la classe "box-elettro"
        wrapper2.innerHTML = `
            
            <h1 class="text-center elettro mb-4 bold">Dati raccolti dall’elettrolizzatore</h1>
                <p class="big-card-text text-justify">
                Il sistema di monitoraggio fornisce informazioni  sulle prestazioni dell’elettrolizzatore,<br>
                quali la conducibilità, la temperatura dell' acqua, pressione, flusso di idrogeno prodotto, tensione e corrente della cella P.E.M
                </p>
            `;
        chartsContainer.appendChild(wrapper2);
        generateAlarms(1); // genera gli allarmi per l'elettrolizzatore
    }else{
        chartsContainer.classList.remove("box-elettro"); // Rimuovi la classe "box-serra"
        chartsContainer.classList.add("box-serra"); // Aggiungi la classe "box-elettro"
        wrapper2.innerHTML = `
            <div class="big-card" >
            <h1 class="text-center serra mb-4 bold">Parametri della Serra Idroponica</h1>
                <p class="big-card-text text-justify">
                La Dashboard fornisce una visione completa delle condizioni ambientali all'interno della serra, tra cui la temperatura, <br>
                il pH della soluzione nutriente e la salute delle colture. Questi dati come, pH, Temperatura e conducibilità della nutritiva consentono di monitorare e ottimizzare<br>
                le condizioni di crescita delle piante aromatiche coltivate per garantirne la corretta crescita.
                </p>
            </div>`;
        chartsContainer.appendChild(wrapper2);
        generateAlarms(0); // genera gli allarmi per la serra
    }


}

function generateAlarms(data){
    const chartsContainer = document.getElementById('status-flags');
    chartsContainer.innerHTML = ''; // Clear any existing content
    const wrapper2 = document.createElement('div');

    if (data == 1){ //elettrolizzatore
    wrapper2.innerHTML = `
        <div class="status-container">
            <div class="status-item">
                <div id="status-dot" class="status-dot"></div>
                <span id="status-text" class="status-text">Elettrolizzatore attivo</span>
            </div>
            <div class="status-item">
                <div id="status-dot-alarm" class="status-dot"></div>
                <span id="status-text-alarm" class="status-text">Alarms</span>
            </div>
            <div class="status-item">
                <div id="dotstatus--warning" class="status-dot"></div>
                <span id="status-text-warning" class="status-text">Warnings</span>
            </div>
        </div>`;
    chartsContainer.appendChild(wrapper2);

    } else{ //serra
        wrapper2.innerHTML = `
        <div class="status-container">
            <div class="status-item">
                <div id="status-dot" class="status-dot"></div>
                <span id="status-text" class="status-text">Sensori serra attivi</span>
            </div>
            <div class="status-item">
                <div id="status-dot-valvola" class="status-dot"></div>
                <span id="status-text-valvola" class="status-text">Valvola chiusa</span>
            </div>
        </div>`;
        chartsContainer.appendChild(wrapper2);

    }
}

 // Funzione per determinare il colore del pallino e il testo
 function updateStatoElettro(data) {
    generateDescription(1);
  
    if ('pingElettro' in data) {
        // prendo solo il valore dell'ultima riga (la più recente)
        const lastObject = data.pingElettro[data.pingElettro.length - 1];
        ping_elettro = lastObject.value;
        //console.log(`ping elettro: ${lastObject.time} ${ping_elettro}`); 
    }
    else ping_elettro = 0;

    if ('IB_Alarms' in data ) {
        // prendo solo il valore dell'ultima riga (la più recente)
        const lastObject = data.IB_Alarms[data.IB_Alarms.length - 1];
        alarms = lastObject.value;
    }
    else alarms = 0;

    //console.log(data.IB_Alarms);
    if ('IB_Warnings' in data ) {
        // prendo solo il valore dell'ultima riga (la più recente)
        const lastObject = data.IB_Warnings[data.IB_Warnings.length - 1];
        warnings = lastObject.value;
    }
    else warnings = 0;
    
    //console.log("alarms: ",alarms,"warnings: ",warnings);
    // emette il suono dell'allarme
    if (alarms==1 || warnings==1){
        allarme.play();
    }
    else {
        allarme.pause();
        allarme.currentTime = 0;
    }
         
    statusDot = document.getElementById("status-dot");
    statusText = document.getElementById("status-text");
    // Determina il colore del pallino
    if(simulateDataElettro == false) {
        dotColor = ping_elettro == 1 ? "green" : "red";
        statusDot.style.backgroundColor = dotColor;
    }
    else {
        dotColor = ping_elettro == 1 ? "lightgreen" : "red";
        statusDot.style.backgroundColor = dotColor;
    }
    
    // Determina il testo dello stato
    textStatus = ping_elettro == 1 ? "" : "non ";
    statusText.textContent = `Elettrolizzatore ${textStatus}attivo`;

    // stato alarm
    statusDot = document.getElementById('status-dot-alarm');
    statusText = document.getElementById("status-text-alarm");
    // Determina il colore del pallino
    if (simulateDataElettro == false) {
        dotColor = alarms == 1 ? "red" : "green";
    } else {
        dotColor = alarms == 1 ? "red" : "lightgreen";
    }
    statusDot.style.backgroundColor = dotColor;

    
    // Determina il testo dello stato
    textStatus = alarms == 1 ? "" : "non ";
    statusText.textContent = `Allarme ${textStatus}attivo`;

    // warnings
    statusDot = document.getElementById('status-dot-warning');
    statusText = document.getElementById("status-text-warning");
    // Determina il colore del pallino
    if (simulateDataElettro == false) {
        dotColor = warnings == 1 ? "red" : "green";
    } else {
        dotColor = warnings == 1 ? "red" : "lightgreen";
    }
    statusDot.style.backgroundColor = dotColor;
    // Determina il testo dello stato
    textStatus = warnings == 1 ? "" : "non ";
    statusText.textContent = `Warning ${textStatus}attivo`;
}

function updateStatoSerra(data) {
    generateDescription(0);

    //console.log('dati: '+data);

    if ('pingSerra' in data) {
        //console.log("dati pingSerra: "+data.pingSerra);
        // prendo solo il valore dell'ultima riga (la più recente)
        //const lastObject = data.pingSerra[data.pingSerra.length - 1];
        //ping_serra = lastObject.value;
        ping_serra = data.pingSerra[0].value;
    }
    else {
        ping_serra = 0;
        console.log('pingSerra not in data');
        console.log(data);
    }

    if ('valvolaAperta' in data) {
        const lastObject = data.valvolaAperta[data.valvolaAperta.length - 1];
        valvolaAperta = lastObject.value;
    }
    else {
        valvolaAperta = 0;
        console.log('valvolaAperta not in data');
        console.log(data);
    }

    //console.log('ping serra'+ping_serra);
    statusDot = document.getElementById("status-dot");
    statusText = document.getElementById("status-text");

    // Determina il colore del pallino
    if(simulateDataSerra== false) {
        dotColor = ping_serra == 1 ? "green" : "red";
    }
    else {
        dotColor = ping_serra == 1 ? "lightgreen" : "red";
    }
    statusDot.style.backgroundColor = dotColor;
    
    // Determina il testo dello stato
    textStatus = ping_serra == 1 ? "" : "non ";
    statusText.textContent = `Sensori serra ${textStatus}attivi`;

    // flag Valvola
    statusDot = document.getElementById("status-dot-valvola");
    statusText = document.getElementById("status-text-valvola");

    // Determina il colore del pallino
    if(simulateDataSerra== false) {
        dotColor = valvolaAperta == 0 ? "green" : "red";
    }
    else {
        dotColor = valvolaAperta == 0 ? "lightgreen" : "red";
    }
    statusDot.style.backgroundColor = dotColor;
    
    // Determina il testo dello stato
    textStatus = valvolaAperta == 1 ? "aperta" : "chiusa";
    statusText.textContent = `Valvola ${textStatus}`;
}

function paginaElettro() {
    toggleMenu();
    if (pagina == 'elettro') return; // Already on the Elettrolizzatore page

    pagina = 'elettro';
    if (timerWebcam != null) {
        clearInterval(timerWebcam);
        timerWebcam = null;
    }
    document.getElementById('titolo-pagina').innerText = '';
    updateStatoPagina = updateStatoElettro;

    // Define the variables and descriptions for the charts
    grafici = {
        AIM_COND_H2O: {descr:"Conducimetro H2O (uS/cm)",y:0.35,ymin:0,ymax:0.5},
        AIM_H2O_temp: {descr:"Temperatura H2O (°C)",y:37,ymin:0,ymax:55},
        AIM_Press_H2: {descr:"Pressione H2 (Bar)",y:14,ymin:0,ymax:25},
        AIM_Prod_Fact: {descr:"Produzione H2 (%)",y:78,ymin:0,ymax:110},
        AIM_Flow_H2_ml: {descr:"Flusso H2 (mL/min)",y:143,ymin:0,ymax:210},
        AIM_Cell_Current: {descr:"Corrente della cella (A)",y:5.2,ymin:0,ymax:6.5},
        AIM_Cell_Voltage: {descr:"Tensione della cella (V)",y:19,ymin:0,ymax:25}
    };
    init();
}

function paginaSerra() {
    toggleMenu();
    if (pagina === 'serra') return; // Already on the Serra page

    pagina = 'serra';
    const statusContainer1 = document.getElementById('status-flags');
    statusContainer1.innerHTML = ''; // Clear any existing content
    document.getElementById('titolo-pagina').innerText = '';
    updateStatoPagina = updateStatoSerra;

    if (oneChart) // tem1 2 nello stesso grafico. e anche ph e conducimetro
        grafici = {
            temperatura1: {descr:"Temperatura (°C)",y:17.3,ymin:5,ymax:30,label:'ingresso'},
            temperatura2: {inGrafico:'temperatura1',dataset:1,label:'uscita',y:16.0,ymin:5,ymax:30},
            pH1: {descr:"PH",y:4.4,ymin:0,ymax:10,label:'ingresso'},
            pH2: {inGrafico:'pH1',dataset:1,label:'uscita',y:4.1,ymin:0,ymax:10},
            conducimetro1: {descr:"Conducibilità (uS)",y:1800,ymin:0,ymax:3500,label:'ingresso'},
            conducimetro2: {inGrafico:'conducimetro1',dataset:1,label:'uscita',y:1770,ymin:0,ymax:3500}
        };
    else
        grafici = {
            temperatura1: {descr:"Temperatura ingresso (°C)",y:17.3,ymin:5,ymax:30},
            temperatura2: {descr:"Temperatura uscita (°C)",y:16.8,ymin:5,ymax:30},
            pH1: {descr:"PH ingresso",y:4.4,ymin:0,ymax:8},
            pH2: {descr:"PH uscita",y:4.7,ymin:0,ymax:8},
            conducimetro1: {descr:"Conducibilità ingresso (uS)",y:1800,ymin:0,ymax:3500},
            conducimetro2: {descr:"Conducibilità uscita (uS)",y:1770,ymin:0,ymax:3500}
        };
    init();
}

// Funzione principale che gestisce l'inizializzazione
function destroyCharts(){
    Object.values(grafici).forEach(val => {
        if ('chart' in val)
            val.chart.destroy()
    })
}
// Funzione per cancellare i dati presenti nei grafici
function clearCharts(){
    Object.values(grafici).forEach(val => {
        if ('chart' in val){
            const ds    = val.dataset || 0;
            val.chart.data.datasets.forEach(dataset => {
                dataset.data = [];
            });
            val.chart.data.labels = [];
        }
    })
}

function init() {
    showLoader();
    // rimuoviamo gli eventuali graficxi precedenti
    const chartsContainer = document.getElementById('charts-container');
    chartsContainer.innerHTML = '';
    destroyCharts();
    if (pagina === 'serra' ){
        createImageWebcamBlock(chartsContainer)
        // webcam
        // Primo caricamento
        checkAndUpdateImage();

        // Controllo ogni 30 secondi
        timerWebcam = setInterval(checkAndUpdateImage, 15000);
    }
    Object.keys(grafici).forEach((nome) => {
        val = grafici[nome];
        if (!('inGrafico' in val)) { // non è una seconda serie di dati
            const chartWrapper = document.createElement('div');
            chartWrapper.classList.add('chart-wrapper');
            chartWrapper.innerHTML = `<canvas id="chart-${nome}" width="300" height="250"></canvas>`;
            chartsContainer.appendChild(chartWrapper);
            val.chart = doChart(nome,val);
            val.chart.options.plugins.legend.display=false; // se solo una serie, no label
        }
        else {  // lo mettiamo nello stesso grafico già creato
            val.chart = grafici[val.inGrafico].chart; 
            val.chart.data.datasets[val.dataset] = { 
                data: [],
                label: val.label,
                borderColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                borderWidth: borderWidth, // Thicker line
                pointRadius: pointRadius, // Larger points
                
                fill: true
            }
            // fa vedere le label delle serie
            val.chart.options.plugins.legend.display=true;
        }
    });
    
    updateCharts(loadNpoint).then((netError)=>{ 
        if (!netError)
            hideLoader();
    });
    gestScalaGrafici();
}

function createImageWebcamBlock(container) {

    // Creo il div frameImg
    const webCamDiv = document.createElement('div');
    webCamDiv.className = 'webCamDiv';
    //webCamDiv.innerHTML = '<h4>Immagine da webcam</h4>';
    
    const frameDiv = document.createElement('div');
    frameDiv.className = 'frameImg';

    // Creo l'immagine
    const img = document.createElement('img');
    img.id = 'webcamImage';
    img.src = '';
    img.alt = 'Immagine da webcam';
    img.onclick = openModal;  // senza () così passa il riferimento alla funzione

    // Aggiungo l'immagine al div
    frameDiv.appendChild(img);

    // Creo il div timestamp
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'timestamp';
    timestampDiv.id = 'imageTimestamp';
    timestampDiv.textContent = 'Caricamento data...';

    // Appendo i due div al contenitore principale
    webCamDiv.appendChild(frameDiv);
    webCamDiv.appendChild(timestampDiv);
    container.appendChild(webCamDiv);
}



// Variabile di stato per il menu
let menuOpen = true;
// Funzione per aprire/chiudere il menu
function toggleMenu() {
    menuOpen = !menuOpen;  // Cambia lo stato del menu
    const menu = document.getElementById('menu');

    // Aggiungi o rimuovi la classe 'open' in base allo stato del menu
    if (menuOpen) {
        menu.classList.add('open');
    } else {
        menu.classList.remove('open');
    }
}

function secondiDallaMezzanotte() {
    const oraCorrente = new Date();
    const mezzanotte = new Date(oraCorrente);
    mezzanotte.setHours(0, 0, 0, 0); // Imposta l'ora a mezzanotte
  
    const differenza = oraCorrente - mezzanotte; // Differenza in millisecondi
    const secondi = Math.floor(differenza / 1000); // Converti in secondi
  
    return secondi;
  }
  
  function gestVisualizza() {
    const idx = this.selectedIndex;
    switch (idx) {
        case 0: // Realtime ultimo minuto
            realTime = true;
            loadNpoint = 60;
            break;
        case 1: // Ultimi 5 minuti
            realTime = false;
            loadNpoint = 60 * 5;
            break;
        case 2: // Ultima ora
            realTime = false;
            loadNpoint = 60 * 60;
            break;
        case 3: // Tutta la giornata
            realTime = false;
            loadNpoint = secondiDallaMezzanotte();
            break;
        case 4: // ultime 24 ore
            realTime = false;
            loadNpoint = 24 * 3600; // 1 giorni in secondi
            break;
        case 5: // Ultimi 7 giorni
            realTime = false;
            loadNpoint = 7 * 24 * 3600; // 7 giorni in secondi
            break;
        case 6: // Ultimi 10 giorni
            realTime = false;
            loadNpoint = 10 * 24 * 3600; // 10 giorni in secondi
            break;
    }
    // pulisce dai vecchi dati
    showLoader();
    clearCharts();
    updateCharts(loadNpoint).then( netError =>{  
        if (!netError)
            hideLoader();
    });
}

function gestScalaGrafici(){
    ele = document.getElementById('scalaGraficiAutomatica');
    if (ele.checked !== undefined)
        scalaGraficiAutomatica = ele.checked;
    //console.log('Checkbox "Scala grafici automatica" selezionata:', scalaGraficiAutomatica);    
    Object.keys(grafici).forEach((nome) => {
        if (grafici[nome].inGrafico !== undefined){
            return;
        }
        let chart = grafici[nome].chart;
        if (scalaGraficiAutomatica) {
            chart.originalY = chart.options.scales.y;
            delete (chart.options.scales.y);
        }
        else {
            if (chart.originalY !== undefined)
                chart.options.scales.y = chart.originalY;
        }
        chart.update();
    });
}

function toggleSimula() {
    if (pagina === 'elettro') {            
        simulateDataElettro = !simulateDataElettro;
        console.log('Simulazione toggled in Elettrolizzatore');
    } else if (pagina === 'serra') {
        simulateDataSerra = !simulateDataSerra;
        console.log('Simulazione toggled in Serra');
    }
    init();
    return;
}

// Inizializza la pagina
window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('noonechart')) {
        oneChart = false;
    }
    
    // Aggiungi il listener per il clic del pulsante del menu
    document.getElementById('menu-btn').addEventListener('click', toggleMenu);
    document.getElementById('mynavbar').addEventListener('dblclick', toggleSimula);
    document.getElementById('menu-elettro').addEventListener('click', paginaElettro);
    document.getElementById('menu-serra').addEventListener('click', paginaSerra)
    document.getElementById('visualizza').addEventListener('change', gestVisualizza);
    document.getElementById('scalaGraficiAutomatica').addEventListener('change', gestScalaGrafici);
    realTime = document.getElementById('visualizza').selectedIndex == 0;

    // quale pagina visualizzare per prima
    paginaSerra();
    //paginaElettro();
    // Aggiorna i grafici e lo stato ogni secondo
    intervalId = setInterval(() => {
        if (realTime) {// se in realTime, aggiorniamo i grafici
            // Aggiorna i grafici
            updateCharts().then(netError  =>{       
                if (netError == false)
                    hideLoader();            
                });
        }
    }, timeLaps * 1000);
    // Chiude la modal dell'immagine della webcam col tasto Esc
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            closeModal();
        }
    });

}
window.onpopstate = function() {
    clearInterval(intervalId);
    destroyCharts();
}

/** gestione webcam  */
let lastTimestamp = null;
let timerWebcam = null;

function checkAndUpdateImage() { 
    
    // per provarla localmente 
    /*
    console.log('Nuova immagine trovata, aggiorno...');
    const imageUrl = 'latest.jpg?t=' + new Date().getTime();
    document.getElementById('webcamImage').src = imageUrl;
    document.getElementById('modalwebcamImg').src = imageUrl;
    document.getElementById('imageTimestamp').textContent = 'Ultimo aggiornamento: ';
    return;
    */

    fetch('file-info.php')
        .then(response => response.json())
        .then(data => {
            const currentTimestamp = data.timestamp;

            if (currentTimestamp !== lastTimestamp) {
                //console.log('Nuova immagine trovata, aggiorno...');
                const imageUrl = 'latest.jpg?t=' + new Date().getTime();
                document.getElementById('webcamImage').src = imageUrl;
                document.getElementById('modalwebcamImg').src = imageUrl;
                document.getElementById('imageTimestamp').textContent = 'Ultimo aggiornamento: ' + currentTimestamp;
                lastTimestamp = currentTimestamp;
            } else {
                console.log('Immagine invariata.');
            }
        })
        .catch(error => {
            console.error('Errore nel caricamento data:', error);
            document.getElementById('imageTimestamp').textContent = 'Impossibile ottenere data aggiornamento';
        });
}

// Modal funzionalità
function openModal() {
    document.getElementById('mywbcamModal').style.display = "block";
}

function closeModal() {
    document.getElementById('mywbcamModal').style.display = "none";
}