const MaxPointGraph = 60; // numro massimo di punti da visualizzare nel grafico
let simulateData = true; // simuliamo i dati?
let timeLaps = 1; // refresh ogni 2 secondi se non in simulaData
const apiUrl = 'https://www.heliosproject.it/sensori/get-data-grafici.php';
let pagina; // pagina 'elettro' o 'serra'
let grafici={}; //usato per nomi variabili e grafici
let updateStatoPagina   // funzione per aggiornare lo stato dell'elettrolizzatore e dei sensori della serra

// Funzione per ottenegenerare numeri random come quelli ricevuti dal server
function genOra(secondi=timeLaps){
    const now = new Date();

    // Calcola la data e ora di t secondi fa
    const passato = new Date(now - secondi * 1000);

    return `${passato.getHours()}:${passato.getMinutes()}:${passato.getSeconds()}`;
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
            ret[nome].push(genValue(val,second));
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

function doChart(nome=""){
    const opt = grafici[nome];
    const ctx = document.getElementById(`chart-${nome}`);
    const optChart = {		  
        type: 'line',
        data: {
        //labels: [],
        //labels:[1,2,3,4,5,6,7,8,10], 
        datasets: [{ 
            //data: generateRandomData(),
            data: [],
            //label: "",
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
                    display: false // Disabilita la visualizzazione della leggenda
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

// Funzione per creare i grafici inizialmente
function createCharts() {
    // Dizionario per contenere tutte le istanze dei grafici
    // indicizzato con i nomi delle variabili dichiarate in grafici qui appena sotto
    Object.keys(grafici).forEach((nome) => {
        grafici[nome].chart = doChart(nome);
    })
    updateCharts(MaxPointGraph); // carica maxpointgraph valori la prima volta
}

// Funzione per aggiornare i grafici con nuovi dati
async function updateCharts(second=timeLaps) {
    let data;	

    if (simulateData)
        data = fetchDataSim(second);
    else
        data = await fetchData(second); // Ottieni i nuovi dati ogni secondo

    updateStatoPagina(data);
    //console.log(data);
    Object.keys(grafici).forEach((nome) => {
        if (nome in data) {
            const chart = grafici[nome].chart;
            const dati = data[nome];
            dati.forEach(
                (riga) => {
                    chart.data.labels.push(riga.time);
                    chart.data.datasets[0].data.push(riga.value);
                }
            );
            chart.data.labels.splice(0, chart.data.labels.length - MaxPointGraph);
            chart.data.datasets[0].data.splice(0, chart.data.datasets[0].data.length - MaxPointGraph);
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
}

function paginaSerra(){
    toggleMenu();
    if (pagina == 'serra')
        return; // siamo già in paginaSerra
    pagina = 'serra';
    //document.getElementById('status-container').classList.add('hidden');
    document.getElementById('titolo-pagina').innerText='Serra idroponica';
    updateStatoPagina = updateStatoSerra;
    grafici = {
        temeratura1: {descr:"Temperatura 1 in °C",y:17.3,ymin:5,ymax:25},
        temeratura2: {descr:"Temperatura 2 in °C",y:16.8,ymin:5,ymax:22},
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
        const chartWrapper = document.createElement('div');
        chartWrapper.classList.add('chart-wrapper');
        chartWrapper.innerHTML = `<canvas id="chart-${nome}" width="300" height="250"></canvas>`;
        chartsContainer.appendChild(chartWrapper);
    });
    createCharts();
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


// Inizializza la pagina
window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    // Controlla se esiste il parametro 'nosim' nell'URL per non simulare i dati ma prenderli dal sito del DB
    if (params.has('nosim')) {
        simulateData = false;
        timeLaps = 2; // ogni secondo non in simulazione
    }
    // Aggiungi il listener per il clic del pulsante del menu
    document.getElementById('menu-btn').addEventListener('click', toggleMenu);
    document.getElementById('menu-elettro').addEventListener('click', paginaElettro);
    document.getElementById('menu-serra').addEventListener('click', paginaSerra)
    paginaElettro();
    // Aggiorna i grafici e lo stato ogni secondo
    intervalId = setInterval(() => {
        updateCharts(); // Aggiorna i grafici
    }, timeLaps * 1000);
  
}
window.onpopstate = function() {
    clearInterval(intervalId);
    destroyCharts();
}