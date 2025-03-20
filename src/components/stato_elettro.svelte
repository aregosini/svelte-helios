<script>
    export let stato_elettro = 0;  // Variabile di stato ricevuta dal componente genitore
  
    // Funzione per determinare il colore del pallino
    const getStatusColor = () => {
      return stato_elettro == 1 ? "green" : "red";
    };
    const getTextStatus = () => {
      return stato_elettro == 1 ? "" : "non ";
    };
</script>
  
  <style>
    .status-container {
      display: flex;
      font-size: 18px;
      margin-left: 0; /* Allinea il contenitore a sinistra */
      margin-bottom: 10px;
      width: 95%; /* Imposta una larghezza se necessario */
    }
  
    .status-text {
      margin-left: 10px;  /* Distanza tra il testo e il pallino */
    }
  
    .status-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: var(--dot-color);
    }
  </style>
  
  <div class="status-container">
    <div class="status-dot" style="background-color: {getStatusColor()}"></div>  <!-- Pallino colorato in base allo stato -->
    <span class="status-text">Elettrolizzatore {getTextStatus()}attivo</span>
  </div>
  