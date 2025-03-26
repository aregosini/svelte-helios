<style global>
    @import '../../styles/graph.css';
</style>

<script>
	import { onMount } from 'svelte';
    import * as utils from '$lib/graph_utils';  // Importa il modulo condiviso
    import Navbar from '../../components/navbar.svelte';

	// nome delle variabili e descrizione nel grafico
	const grafici = {
        temeratura1: {descr:"Temperatura 1"},
        temeratura2: {descr:"Temperatura 2"},
        pH1: {descr:"PH 1"},
        pH2: {descr:"PH 2"},
        conducimetro1: {descr:"Conducimetro 1"},
        conducimetro2: {descr:"Conducimetro 2"}
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
      const charts = utils.createCharts(grafici); 
  
	  // Aggiorna i grafici ogni secondo con nuovi dati
		const interval = setInterval(() => {
			utils.updateCharts(charts);  // Recupera i nuovi dati e aggiorna i grafici
		}, 2000);
  
	  // Pulisci l'intervallo quando il componente viene distrutto
	  return () => clearInterval(interval);
	});
  </script>
  
  <main>
	<Navbar />
	<h1>Serra idroponica</h1>

	<div class="charts-container">
	  {#each Object.keys(grafici) as nome}
		<div class="chart-wrapper">
		  <canvas id="chart-{nome}" width="300" height="250"></canvas>
		</div>
	  {/each}
	</div>
  </main>
 
  
  