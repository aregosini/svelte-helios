import Chart from 'chart.js/auto';

const MaxPointGraph = 50; // numro massimo di punti da visualizzare nel grafico
const simulateData = true;
const apiUrl = 'https://www.heliosproject.it/sensori/get-data-grafici.php';  // Sostituisci con il tuo URL API

// Funzione per ottenegenerare numeri random come quelli ricevuti dal server
function genOra(){
    return `${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60)}:${Math.floor(Math.random() * 60)}`;
}	

let nome_var; // salva i nomi delle variabili che sono le chiavi dei grafici
            // usato solo per simulare i dati casuali dei grafici
function fetchDataSim() {
    let ret = {};

    Object.keys(nome_var).forEach((nome) => {
        ret[nome] = [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}];
    })
    return ret;
    /*
    return {
        AIM_COND_H2O: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
        AIM_H2O_temp: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
        AIM_Press_H2: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
        AIM_Prod_Fact: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
        AIM_Flow_H2_ml: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
        AIM_Cell_Current: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
        AIM_Cell_Voltage: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}]
    }
    */
}

async function fetchData() {
    try {
        const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error('Errore nel recupero dei dati');
    }
    const data = await response.json();
    return data;  // Assumiamo che i dati siano già nel formato corretto
    } catch (error) {
        console.error('Errore durante la richiesta dei dati:', error);
        return { labels: [], datasets: [] };  // Ritorna un oggetto vuoto in caso di errore
    }
}

function doChart(nomeChart,descr){
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
export function createCharts(grafici) {
    nome_var = grafici;
    let charts = {};  // Dizionario per contenere tutte le istanze dei grafici
					  // indicizzato con i nomi delle variabili dichiarate in grafici qui appena sotto

    Object.keys(grafici).forEach((nome) => {
        charts[nome] = doChart(nome,grafici[nome]);
    })
    updateCharts(charts);
    return charts;
}

// Funzione per aggiornare i grafici con nuovi dati
export async function updateCharts(charts) {
    let data;	

    if (simulateData)
        data = fetchDataSim();
    else
        data = await fetchData(); // Ottieni i nuovi dati ogni secondo

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
        while (chart.data.labels.length > MaxPointGraph) {
            chart.data.labels.shift(); // Rimuove il primo elemento (quello più vecchio)
            chart.data.datasets[0].data.shift();
        }
        chart.update('none'); // Rende il grafico "live" con i nuovi dati aggiunti
    }
    });
}
