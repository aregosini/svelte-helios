<style global>
    @import '../styles/graph.css';
</style>

<script>
	import { onMount } from 'svelte';
    import * as utils from '$lib/graph_utils';  // Importa il modulo condiviso
    import Navbar from '../components/navbar.svelte';
	import Elettro from '../components/stato_elettro.svelte';
	
	let stato_elettro = 0;

	// nome delle variabili e descrizione nel grafico
	const grafici = {
		AIM_COND_H2O: "Conducimetro H2O",
		AIM_H2O_temp: "Temperatura H2O",
		AIM_Press_H2: "Pressione H2",
		AIM_Prod_Fact: "PROD FACT",
		AIM_Flow_H2_ml: "Flusso H2 in ml",
		AIM_Cell_Current: "Corrente della cella",
		AIM_Cell_Voltage: "Tensione della cella"
	};	
	
	onMount(() => {
	  // Inizializza i grafici con i dati iniziali
      let charts = utils.createCharts(grafici); 
	  stato_elettro = utils.ping_elettro;

	  // Aggiorna i grafici ogni secondo con nuovi dati
	  if (true){
        const interval = setInterval(() => {
            utils.updateCharts(charts);  // Recupera i nuovi dati e aggiorna i grafici
			stato_elettro = utils.ping_elettro;
        }, 1000);
  
	  // Pulisci l'intervallo quando il componente viene distrutto
	  return () => clearInterval(interval);
	}
	
	});
	
</script>

  <main>
    <Navbar />
    <h1>Elettrolizzatore</h1>
	<Elettro {stato_elettro}/>

	<div class="charts-container">
	  {#each Object.keys(grafici) as nome}
		<div class="chart-wrapper">
		  <canvas id="chart-{nome}" width="300" height="250"></canvas>
		</div>
	  {/each}
	</div>
  </main>
 
  <script>
	// Aggiungi un listener per ricevere i messaggi
	window.addEventListener("message", function(event) {
		console.log('in message: '+event.origin)
		// Verifica se il messaggio proviene dal dominio corretto
		//if (event.origin === "https://www.heliosproject.it") {
		if (event.data === "getHeight") {
			// Invia l'altezza del corpo dell'iframe al sito principale
			var bodyHeight = document.body.scrollHeight;
			event.source.postMessage(bodyHeight, event.origin);
		}
		//}
	});
  </script>
  