<style global>
    @import '../styles/graph.css';
</style>

<script>
	import { onMount } from 'svelte';
    import * as utils from '$lib/graph_utils';  // Importa il modulo condiviso
    import Navbar from '../components/navbar.svelte';

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
/*
	function fetchDataSim() {
		return {
			AIM_COND_H2O: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
			AIM_H2O_temp: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
			AIM_Press_H2: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
			AIM_Prod_Fact: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
			AIM_Flow_H2_ml: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
			AIM_Cell_Current: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}],
			AIM_Cell_Voltage: [{"time":genOra(),"value":Math.floor(Math.random() * 1000)}]
		}
	}
*/
	onMount(() => {
	  // Inizializza i grafici con i dati iniziali
      let charts = utils.createCharts(grafici); 
  
	  // Aggiorna i grafici ogni secondo con nuovi dati
        const interval = setInterval(() => {
            utils.updateCharts(charts);  // Recupera i nuovi dati e aggiorna i grafici
        }, 1000);
  
	  // Pulisci l'intervallo quando il componente viene distrutto
	  return () => clearInterval(interval);
	});
</script>

  <main>
    <Navbar />
    <h1>Elettrolizzatore</h1>

	<div class="charts-container">
	  {#each Object.keys(grafici) as nome}
		<div class="chart-wrapper">
		  <canvas id="chart-{nome}" width="300" height="250"></canvas>
		</div>
	  {/each}
	</div>
  </main>
 
  
  