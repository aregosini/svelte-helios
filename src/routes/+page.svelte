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
		AIM_COND_H2O: {descr:"Conducimetro H2O",ymin:0,ymax:0.6},
		AIM_H2O_temp: {descr:"Temperatura H2O",ymin:0,ymax:50},
		AIM_Press_H2: {descr:"Pressione H2",ymin:0,ymax:18},
		AIM_Prod_Fact: {descr:"Produzione H2 in %",ymin:0,ymax:100},
		AIM_Flow_H2_ml: {descr:"Flusso H2 in ml",ymin:0,ymax:200},
		AIM_Cell_Current: {descr:"Corrente della cella",ymin:0,ymax:6.5},
		AIM_Cell_Voltage: {descr:"Tensione della cella",ymin:0,ymax:25}
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
        }, 2000);
  
	  // Pulisci l'intervallo quando il componente viene distrutto
	  return () => clearInterval(interval);
	}

	});
	// Aggiungi un listener per ricevere i messaggi
	
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
 
  