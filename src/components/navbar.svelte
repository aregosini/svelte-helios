<style>
    /* Navbar in alto */
    nav {
        position: fixed;  /* Fissa la navbar in cima */
        top: 0;
        left: 0;
        width: 100%;
        padding: 10px 0;
        z-index: 1000;  /* Assicura che la navbar stia sopra il contenuto */
        background-color: #5e5d5d;
        color: white;
    }

    /* Navbar container */
    .navbar {
        display: flex;          /* Usa Flexbox per il layout */
        padding: 0 20px;        /* Distanza tra il contenuto e i bordi */
    }

    /* Pulsante per aprire il menu */
    .menu-btn {
        background-color: #444;
        border: none;
        color: white;
        font-size: 20px;
        padding: 10px;
        cursor: pointer;
        border-radius: 5px;
    }

    /* Menu a scomparsa */
    .menu {
        display: none;
        position: absolute;
        top: 50px;             /* Posiziona il menu subito sotto la navbar */
        left: 0;
        background-color: #2d2c2c;
        flex-direction: column;
        text-align: left;
        border-radius: 5px;
        margin-left: 10px;
    }

    /* Quando il menu è aperto */
    .menu.open {
        display: flex;
    }

    /* Link del menu */
    .menu a {
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        font-size: 18px;
        display: block;
        border-bottom: 1px solid #555;
    }

    .menu a:hover {
        background-color: #666;
    }
</style>
<script>
    // Variabile di stato per il menu
    let menuOpen = false;

    // Funzione per aprire/chiudere il menu
    function toggleMenu() {
        menuOpen = !menuOpen;  // Cambia lo stato del menu
    }
</script>

<nav>
    <div class="navbar">
        <button class="menu-btn" on:click={toggleMenu}>☰ Scegli grafici</button>
    </div>

    <!-- Menu a scomparsa -->
    <div class="menu {menuOpen ? 'open' : ''}">
        <a href="/">Elettrolizzatore</a>
        <a href="/serra">Serra</a>
    </div>
</nav>
