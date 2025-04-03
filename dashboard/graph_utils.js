const MaxPointGraph = 60; // numro massimo di punti da visualizzare nel grafico
let loadNpoint = MaxPointGraph // numero di punti da caricare dal DB 
let simulateData = true; // simuliamo i dati?
let realTime = true; // dobbiamo fare la fetch dei dati attuali?
let timeLaps = 1; // refresh ogni 2 secondi se non in simulaData
const apiUrl = 'https://www.heliosproject.it/sensori/get-data-grafici.php';
let pagina; // pagina 'elettro' o 'serra'
let grafici={}; //usato per nomi variabili e grafici
let updateStatoPagina   // funzione per aggiornare lo stato dell'elettrolizzatore e dei sensori della serra
let oneChart = true; // temp, ph e conducimetro rispettivamente nello stesso grafico?
let scalaGraficiAutomatica = false;

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

async function fetchData(second=timeLaps) {
    try {
        const response = await fetch(apiUrl+`?second=${second}`,{ cache: 'no-store' });
        //const response = await fetch(apiUrl+`?data=2025-03-18&second=3600*3`,{ cache: 'no-store' });

        //console.log(apiUrl+`?second=${second}`);
        if (!response.ok) {
            throw new Error('Errore nel recupero dei dati');
        }
        const data = await response.json();
        return data;  // Assumiamo che i dati siano già nel formato corretto
    } catch (error) {
        console.error('Errore durante la richiesta dei dati:', error);
        return [];  // Ritorna un oggetto vuoto in caso di errore
    }
}

function doChart(nome,opt){
    const ctx = document.getElementById(`chart-${nome}`);
    if (opt.label === undefined)
        opt.label="";
    if (opt.dataset === undefined)
        opt.dataset=0;

    const optChart = {		  
        type: 'line',
        data: {
        //labels: [],
        //labels:[1,2,3,4,5,6,7,8,10], 
        datasets: [{ 
            //data: generateRandomData(),
            data: [],
            label: opt.label,
            borderColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
            fill: false
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: opt.descr
                },
                legend: {
                    //align:'start',
                    labels:{
                        usePointStyle: true,
                        pointStyle : 'rect'
                    },
                    display: false // Disabilita la visualizzazione della legenda

                }
            },
            responsive: true,
            maintainAspectRatio: false,  // Permette di fare in modo che il canvas possa adattarsi alla dimensione del contenitore
        }
    };
    if ('ymin' in opt){
        optChart.options.scales = {
            y: { min: opt.ymin, max: opt.ymax}
        }
    }
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

// Funzione per aggiornare i grafici con nuovi dati
async function updateCharts(second=timeLaps) {
    let data;	

    if (simulateData)
        data = fetchDataSim(second);
    else
        data = await fetchData(second); // Ottieni i nuovi dati ogni second
    adjData(data);
    updateStatoPagina(data);
    //console.log(data);
    Object.keys(grafici).forEach((nome) => {
        if (nome in data) {
            const chart = grafici[nome].chart;
            const dati = data[nome];
            const ds = grafici[nome].dataset;
            dati.forEach(
                (riga) => {
                    chart.data.labels.push(riga.time);
                    chart.data.datasets[ds].data.push(riga.value);
                }
            );
            chart.data.labels.splice(0, chart.data.labels.length - MaxPointGraph);
            chart.data.datasets[ds].data.splice(0, chart.data.datasets[ds].data.length - MaxPointGraph);
            if (chart.data.labels.length >= MaxPointGraph)
                chart.update('none'); //no animazione. non ci sta dietro!
            else
                chart.update(); // con animazione
        }
    });
}

 // Funzione per determinare il colore del pallino e il testo
 function updateStatoElettro(data) {
    if ('pingElettro' in data) {
        // prendo solo il valore dell'ultima riga (la più recente)
        const lastObject = data.pingElettro[data.pingElettro.length - 1];
        ping_elettro = lastObject.value;
        //console.log(`ping elettro: ${lastObject.time} ${ping_elettro}`);
    }
    else ping_elettro = 0;

    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");

    // Determina il colore del pallino
    const dotColor = ping_elettro == 1 ? "green" : "red";
    statusDot.style.backgroundColor = dotColor;

    // Determina il testo dello stato
    const textStatus = ping_elettro == 1 ? "" : "non ";
    statusText.textContent = `Elettrolizzatore ${textStatus}attivo`;
}

function updateStatoSerra(data) {
    if (Object.keys(data).length>0)
        sensoriSerra = 1
    else sensoriSerra = 0;

    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");

    // Determina il colore del pallino
    const dotColor = sensoriSerra == 1 ? "green" : "red";
    statusDot.style.backgroundColor = dotColor;

    // Determina il testo dello stato
    const textStatus = sensoriSerra == 1 ? "" : "non ";
    statusText.textContent = `Sensori serra ${textStatus}attivi`;
}

function paginaElettro(){
    toggleMenu();
    if (pagina == 'elettro')
        return; // siamo già in paginaSerra
    pagina = 'elettro'
    //document.getElementById('status-container').classList.remove('hidden');
    document.getElementById('titolo-pagina').innerText='Elettrolizzatore';
    updateStatoPagina = updateStatoElettro;
    // nome delle variabili e descrizione nel grafico
    grafici = {
		AIM_COND_H2O: {descr:"Conducimetro H2O",y:0.35,ymin:0,ymax:0.5},
		AIM_H2O_temp: {descr:"Temperatura H2O in °C",y:37,ymin:0,ymax:55},
		AIM_Press_H2: {descr:"Pressione H2",y:14,ymin:0,ymax:25},
		AIM_Prod_Fact: {descr:"Produzione H2 in %",y:78,ymin:0,ymax:100},
		AIM_Flow_H2_ml: {descr:"Flusso H2 in ml",y:143,ymin:0,ymax:200},
		AIM_Cell_Current: {descr:"Corrente della cella in A",y:5.2,ymin:0,ymax:6.5},
		AIM_Cell_Voltage: {descr:"Tensione della cella in V",y:19,ymin:0,ymax:25}
	};
    init();
    const chartsContainer = document.getElementById('charts-container');
    let wrapper = document.createElement('div');
    wrapper.classList.add('chart-wrapper');
    wrapper.innerHTML = `
        <div id="status-alarm" class="status-container">
            <div id="status-dot-alarm" class="status-dot"></div>
            <span id="status-text-alarm" class="status-text">Alarms</span>
        </div>`;
    chartsContainer.appendChild(wrapper);
    let statusDot = document.getElementById('status-dot-alarm');
    statusDot.style.backgroundColor = "green";

    wrapper = document.createElement('div');
    wrapper.classList.add('chart-wrapper');
    wrapper.innerHTML = `
        <div id="status-alarm" class="status-container">
            <div id="status-dot-warning" class="status-dot"></div>
            <span id="status-text-warning" class="status-text">Warnings</span>
        </div>`;
    chartsContainer.appendChild(wrapper);
    statusDot = document.getElementById('status-dot-warning');
    statusDot.style.backgroundColor = "green";
}

function paginaSerra(){
    toggleMenu();
    if (pagina == 'serra')
        return; // siamo già in paginaSerra
    pagina = 'serra';
    //document.getElementById('status-container').classList.add('hidden');
    document.getElementById('titolo-pagina').innerText='Serra idroponica';
    updateStatoPagina = updateStatoSerra;
    if (oneChart) // tem1 2 nello stesso grafico. e anche ph e conducimetro
        grafici = {
            temperatura1: {descr:"Temperatura in °C",y:17.3,ymin:5,ymax:25,label:'temp. 1'},
            temperatura2: {inGrafico:'temperatura1',dataset:1,label:'temp. 2',y:16.0,ymin:5,ymax:22},
            pH1: {descr:"PH",y:4.4,ymin:0,ymax:8,label:'PH 1'},
            pH2: {inGrafico:'pH1',dataset:1,label:'PH 2',y:4.1,ymin:0,ymax:8},
            conducimetro1: {descr:"Conducimetro",y:1800,ymin:0,ymax:3500,label:'cond. 1'},
            conducimetro2: {inGrafico:'conducimetro1',dataset:1,label:'cond. 2',y:1770,ymin:0,ymax:3500}
        };
    else
        grafici = {
            temperatura1: {descr:"Temperatura 1 in °C",y:17.3,ymin:5,ymax:25},
            temperatura2: {descr:"Temperatura 2 in °C",y:16.8,ymin:5,ymax:22},
            pH1: {descr:"PH 1",y:4.4,ymin:0,ymax:8},
            pH2: {descr:"PH 2",y:4.7,ymin:0,ymax:8},
            conducimetro1: {descr:"Conducimetro 1",y:1800,ymin:0,ymax:3500},
            conducimetro2: {descr:"Conducimetro 2",y:1770,ymin:0,ymax:3500}
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

function init() {
    // rimuoviamo gli eventuali graficxi precedenti
    const chartsContainer = document.getElementById('charts-container');
    chartsContainer.innerHTML = '';
    destroyCharts();
    Object.keys(grafici).forEach((nome) => {
        val = grafici[nome];
        if (!('inGrafico' in val)) { // non è una seconda serie di dati
            const chartWrapper = document.createElement('div');
            chartWrapper.classList.add('chart-wrapper');
            chartWrapper.innerHTML = `<canvas id="chart-${nome}" width="300" height="250"></canvas>`;
            chartsContainer.appendChild(chartWrapper);
            val.chart = doChart(nome,val);
        }
        else {  // lo mettiamo nello stesso grafico già creato
            val.chart = grafici[val.inGrafico].chart; 
            val.chart.data.datasets[val.dataset] = { 
                data: [],
                label: val.label,
                borderColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                fill: false
            }
            // fa vedere le label delle serie
            val.chart.options.plugins.legend.display=true;
        }
    });
    updateCharts(MaxPointGraph);
    gestScalaGrafici();
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
  
function gestVisualizza(){
    const idx = this.selectedIndex;
    switch(idx){
        case 0:  // realtime ultimo minuto
            realTime = true;
            loadNpoint = 60;
            break;
        case 1: // ultimi 5 minuti
            realTime = false;
            loadNpoint = 60*5;
            break;
        case 2: // ultima ora 
            realTime = false;
            loadNpoint = 60*60;
            break;
        case 3: // tutta la giornata
            realTime = false;
            loadNpoint = secondiDallaMezzanotte();
            break;
    };
    updateCharts(loadNpoint);
}

function gestScalaGrafici(){
    if (this.checked !== undefined)
        scalaGraficiAutomatica = this.checked;
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

// Inizializza la pagina
window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    // Controlla se esiste il parametro 'nosim' nell'URL per non simulare i dati ma prenderli dal sito del DB
    if (params.has('nosim')) {
        simulateData = false;
        timeLaps = 2; // ogni secondo non in simulazione
    }
    if (params.has('noonechart')) {
        oneChart = false;
    }
    
    // Aggiungi il listener per il clic del pulsante del menu
    document.getElementById('menu-btn').addEventListener('click', toggleMenu);
    document.getElementById('menu-elettro').addEventListener('click', paginaElettro);
    document.getElementById('menu-serra').addEventListener('click', paginaSerra)
    document.getElementById('visualizza').addEventListener('change', gestVisualizza);
    document.getElementById('scalaGraficiAutomatica').addEventListener('change', gestScalaGrafici);
    realTime = document.getElementById('visualizza').selectedIndex == 0;

    if (params.has('serra')) {
        paginaSerra();
    }
    else paginaElettro();
    // Aggiorna i grafici e lo stato ogni secondo
    intervalId = setInterval(() => {
        if (realTime) // se in realTime, aggiorniamo i grafici
            updateCharts(); // Aggiorna i grafici
    }, timeLaps * 1000);
  
}
window.onpopstate = function() {
    clearInterval(intervalId);
    destroyCharts();
}