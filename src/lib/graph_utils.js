import Chart from 'chart.js/auto';

const MaxPointGraph = 60; // numro massimo di punti da visualizzare nel grafico
const simulateData = true;
const apiUrl = 'https://www.heliosproject.it/sensori/get-data-grafici.php';

// Funzione per ottenegenerare numeri random come quelli ricevuti dal server
function genOra(){
    return `${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60)}:${Math.floor(Math.random() * 60)}`;
}	

export let ping_elettro = 1;
let nome_var; // salva i nomi delle variabili che sono le chiavi dei grafici
            // usato solo per simulare i dati casuali dei grafici
function fetchDataSim() {
    let ret = {};

    ping_elettro = 1 - ping_elettro;
    Object.keys(nome_var).forEach((nome) => {
        ret[nome] = [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}];
    })
    return ret;
}

async function fetchData(second=1) {
    try {
        const response = await fetch(apiUrl+`?second=${second}`);
        //const response = await fetch(apiUrl+`?data=2025-03-18&second=3600*3`);

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

function doChart(nomeChart="",descr=""){
    const ctx = document.getElementById(`chart-${nomeChart}`);
    const chart = new Chart(ctx, {		  
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
                text: descr
            },
            legend: {
                display: false // Disabilita la visualizzazione della leggenda
            }
        },
        responsive: true,
        maintainAspectRatio: false  // Permette di fare in modo che il canvas possa adattarsi alla dimensione del contenitore
        }
    });
    return chart;
}

// Funzione per creare i grafici inizialmente
export function createCharts(variabili={}) {
    nome_var = variabili;

    // Dizionario per contenere tutte le istanze dei grafici
    // indicizzato con i nomi delle variabili dichiarate in grafici qui appena sotto
    let charts = {};
    
    Object.keys(variabili).forEach((nome) => {
        charts[nome] = doChart(nome,variabili[nome]);
    })
    updateCharts(charts,MaxPointGraph); // carica maxpointgraph valori la prima volta
    return charts;
}

// Funzione per aggiornare i grafici con nuovi dati
export async function updateCharts(charts,second=1) {
    let data;	

    if (simulateData)
        data = fetchDataSim();
    else
        data = await fetchData(second); // Ottieni i nuovi dati ogni secondo

    //console.log(data);
    Object.keys(charts).forEach((nome) => {
    if (nome in data) {
        const chart = charts[nome];
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

    // gestione del pingElettro. Non è l'ottimale visto che lo si fa anche 
    // quando siamo sulla pagina della serra. Per ora lo lascio qui
    if ('pingElettro' in data) {
        // prendo solo il valore dell'ultima riga (la più recente)
        const lastObject = data.pingElettro[data.pingElettro.length - 1];
        ping_elettro = lastObject.value;
        console.log(`ping elettro: ${lastObject.time} ${ping_elettro}`);
    }
}
