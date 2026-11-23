import {
  estadoJuego,
  reiniciarEstadoJuego,
} from "./estado.js";

import { crearSistemaVisor } from "./visor.js";
import { crearSistemaEnergia } from "./energia.js";
import { crearSistemaManos } from "./manos.js";
import { crearSistemaMesa } from "./mesa.js";
import { crearSistemaMazos } from "./mazos.js";
import { crearSistemaTurnos } from "./turnos.js";
import { configurarEventos } from "./eventos.js";
import { crearSistemaSonidos } from "./sonidos.js";

function iniciarJuego() {
  // --------------------------------
  // ELEMENTOS HTML
  // --------------------------------

  const elementos = {
    pantallaInicio: document.getElementById("pantalla-inicio"),
    pantallaJuego: document.getElementById("pantalla-juego"),
    btnJugar: document.getElementById("btn-jugar"),

    mazoJugadorBtn: document.getElementById("mazo-jugador"),
    mazoRivalBtn: document.getElementById("mazo-rival"),
    descarteJugadorBtn: document.getElementById("descarte-jugador"),
    descarteRivalBtn: document.getElementById("descarte-rival"),
    panelZonaOverlay: document.getElementById("panel-zona-overlay"),
    panelZonaTitulo: document.getElementById("panel-zona-titulo"),
    panelZonaSubtitulo: document.getElementById("panel-zona-subtitulo"),
    panelZonaGrid: document.getElementById("panel-zona-grid"),
    panelZonaCerrar: document.getElementById("panel-zona-cerrar"),
    contadorMazo: document.getElementById("contador-mazo"),
    mazoProgresoBarra: document.getElementById("mazo-progreso-barra"),
    mazoEstado: document.getElementById("mazo-estado"),
    mazoConstruccionGrid: document.getElementById("mazo-construccion-grid"),
    mazoVacio: document.getElementById("mazo-vacio"),
    constructorCatalogo: document.getElementById("constructor-catalogo"),
    filtroEsfera: document.getElementById("filtro-esfera"),
    filtroTipo: document.getElementById("filtro-tipo"),
    filtroNumero: document.getElementById("filtro-numero"),
    ordenCampo: document.getElementById("orden-campo"),
    ordenDireccion: document.getElementById("orden-direccion"),
    limpiarFiltros: document.getElementById("limpiar-filtros"),
    catalogoResultados: document.getElementById("catalogo-resultados"),
    requisitoMazo: document.getElementById("requisito-mazo"),
    administradorMazos: document.getElementById("administrador-mazos"),
    listaMazos: document.getElementById("lista-mazos"),
    seleccionMazoJugador: document.getElementById("seleccion-mazo-jugador"),
    rivalPersonalizado: document.getElementById("rival-personalizado"),
    seleccionMazoRival: document.getElementById("seleccion-mazo-rival"),
    rivalSelector: document.getElementById("rival-selector"),
    editorMazo: document.getElementById("editor-mazo"),
    nombreMazoEditor: document.getElementById("nombre-mazo-editor"),
    tituloEditorMazo: document.getElementById("titulo-editor-mazo"),
    volverAdministrador: document.getElementById("volver-administrador"),
    crearMazo: document.getElementById("crear-mazo"),
    adminBtnJugar: document.getElementById("admin-btn-jugar"),

    manoJugadorEl: document.getElementById("mano-jugador"),
    manoRivalEl: document.getElementById("mano-rival"),

    slotsJugador: Array.from(
      document.querySelectorAll("#campo-jugador .slot-carta")
    ),

    slotsRival: Array.from(
      document.querySelectorAll("#campo-rival .slot-carta")
    ),

    btnDescartar: document.getElementById("btn-descartar"),
    faseDescarteOverlay: document.getElementById("fase-descarte-overlay"),
    faseDescarteEtiqueta: document.getElementById("fase-descarte-etiqueta"),
    faseDescarteTitulo: document.getElementById("fase-descarte-titulo"),
    faseDescarteAyuda: document.getElementById("fase-descarte-ayuda"),
    btnConfirmarDescarte: document.getElementById("btn-confirmar-descarte"),
    contadorSeleccionDescarte: document.getElementById("contador-seleccion-descarte"),

    visorOverlay: document.getElementById("visor-carta-overlay"),
    visorMarco: document.getElementById("visor-carta-marco"),

    valorEnergiaJugador: document.getElementById(
      "valor-energia-jugador"
    ),

    valorEnergiaRival: document.getElementById(
      "valor-energia-rival"
    ),
    energiaJugadorEl: document.getElementById("energia-jugador"),
    energiaRivalEl: document.getElementById("energia-rival"),

    numeroRonda: document.getElementById("numero-ronda"),
    textoTurno: document.getElementById("texto-turno"),
    textoAccion: document.getElementById("texto-accion"),
    btnPasar: document.getElementById("btn-pasar"),

    pantallaResultado: document.getElementById(
      "pantalla-resultado"
    ),

    resultadoTitulo: document.getElementById(
      "resultado-titulo"
    ),

    resultadoSubtitulo: document.getElementById(
      "resultado-subtitulo"
    ),

    resultadoDetalle: document.getElementById(
      "resultado-detalle"
    ),

    btnReiniciar: document.getElementById(
      "btn-reiniciar"
    ),
    btnMenuPrincipal: document.getElementById("btn-menu-principal"),
  };

  // --------------------------------
  // VISOR
  // --------------------------------

  const sonidos = crearSistemaSonidos(elementos);
  const visor = crearSistemaVisor(elementos, sonidos);

  // --------------------------------
  // ENERGÍA
  // --------------------------------

  const energia = crearSistemaEnergia(elementos, sonidos);

  // --------------------------------
  // RESULTADO DE PARTIDA
  // --------------------------------

  function mostrarResultado(resultado) {
    const { ganador } = resultado;

    elementos.pantallaResultado.classList.remove(
      "oculto",
      "resultado-victoria",
      "resultado-derrota",
      "resultado-empate"
    );

    if (ganador === "jugador") {
      elementos.pantallaResultado.classList.add(
        "resultado-victoria"
      );

      elementos.resultadoTitulo.textContent = "GANASTE";
      elementos.resultadoSubtitulo.textContent =
        "SOS UN CRACK";

      elementos.resultadoDetalle.textContent =
        "DEJASTE AL RIVAL SIN ENERGIA";
    } else if (ganador === "rival") {
      elementos.pantallaResultado.classList.add(
        "resultado-derrota"
      );

      elementos.resultadoTitulo.textContent = "PERDISTE";
      elementos.resultadoSubtitulo.textContent =
        "SOS MALISIMO";

      elementos.resultadoDetalle.textContent =
        "EL RIVAL AGOTO TODA TU ENERGIA";
    } else {
      elementos.pantallaResultado.classList.add(
        "resultado-empate"
      );

      elementos.resultadoTitulo.textContent = "EMPATE";
      elementos.resultadoSubtitulo.textContent =
        "NINGUNO SOBREVIVIO";

      elementos.resultadoDetalle.textContent =
        "AMBOS SE QUEDARON SIN ENERGIA";
    }

    elementos.pantallaResultado.classList.remove("oculto");
  }

  // --------------------------------
  // MANOS Y MAZOS
  // --------------------------------

  const manos = crearSistemaManos(elementos, {
    actualizarBotonDescartar: () => {},
    abrirVisorCarta: visor.abrirVisorCarta,
    sonidos,
  });

  const mazos = crearSistemaMazos(elementos, {
    agregarCartaAMano: manos.agregarCartaAMano,
    abrirVisorCarta: visor.abrirVisorCarta,
    sonidos,
  });

  // --------------------------------
  // DESCARTE OBLIGATORIO AL CERRAR CADA TURNO
  // --------------------------------

  let faseDescarteActiva = null;
  let seleccionDescarte = new Set();

  function actualizarSeleccionDescarte() {
    if (!faseDescarteActiva) return;
    const { lado, cantidad } = faseDescarteActiva;
    const manoEl = lado === "jugador" ? elementos.manoJugadorEl : elementos.manoRivalEl;
    manoEl.querySelectorAll(".carta-mano").forEach((cartaEl) => {
      cartaEl.classList.toggle("seleccion-descarte", seleccionDescarte.has(cartaEl.dataset.instanciaId));
    });
    elementos.contadorSeleccionDescarte.textContent = `${seleccionDescarte.size}/${cantidad}`;
    elementos.btnConfirmarDescarte.disabled = seleccionDescarte.size !== cantidad;
  }

  function solicitarDescarte(lado, cantidad, motivo = {}) {
    const manoEl = lado === "jugador" ? elementos.manoJugadorEl : elementos.manoRivalEl;
    const cantidadReal = Math.min(cantidad, estadoJuego.manos[lado].length);
    if (!cantidadReal) return Promise.resolve();

    return new Promise((resolve) => {
      faseDescarteActiva = { lado, cantidad: cantidadReal, resolve };
      seleccionDescarte = new Set();
      document.body.dataset.discardMode = "true";
      document.body.dataset.discardSide = lado;
      elementos.faseDescarteEtiqueta.textContent = lado === "jugador" ? "TU TURNO · DESCARTE OBLIGATORIO" : "TURNO RIVAL · DESCARTE OBLIGATORIO";
      elementos.faseDescarteTitulo.textContent = `ELIGE ${cantidadReal} CARTAS PARA DESCARTAR`;
      elementos.faseDescarteAyuda.textContent = motivo.sinJugar
        ? "No bajaste ninguna carta. Seleccioná las cartas que vas a descartar."
        : `Tenés más de 7 cartas. Elegí ${cantidadReal} para volver al límite de mano.`;
      elementos.faseDescarteOverlay.classList.remove("oculto");
      actualizarSeleccionDescarte();
      sonidos.menuAbrir?.();
    });
  }

  function seleccionarCartaParaDescarte(evento, lado) {
    if (!faseDescarteActiva || faseDescarteActiva.lado !== lado) return;
    const cartaEl = evento.target.closest(".carta-mano");
    if (!cartaEl) return;
    // Una pulsación larga abre el visor y su click sintético no cuenta como selección.
    if (cartaEl.dataset.skipDiscardClick === "1") {
      evento.preventDefault();
      evento.stopPropagation();
      evento.stopImmediatePropagation();
      return;
    }
    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();
    const id = cartaEl.dataset.instanciaId;
    if (seleccionDescarte.has(id)) seleccionDescarte.delete(id);
    else if (seleccionDescarte.size < faseDescarteActiva.cantidad) seleccionDescarte.add(id);
    sonidos.seleccionar?.();
    actualizarSeleccionDescarte();
  }

  // Durante el descarte, un click selecciona; mantener pulsado sigue abriendo el visor.
  elementos.manoJugadorEl.addEventListener("click", (e) => seleccionarCartaParaDescarte(e, "jugador"), true);
  elementos.manoRivalEl.addEventListener("click", (e) => seleccionarCartaParaDescarte(e, "rival"), true);

  elementos.btnConfirmarDescarte.addEventListener("click", () => {
    if (!faseDescarteActiva || seleccionDescarte.size !== faseDescarteActiva.cantidad) return;
    const { lado, resolve } = faseDescarteActiva;
    const mano = estadoJuego.manos[lado];
    const descartadas = mano.filter((instancia) => seleccionDescarte.has(instancia.instanciaId));
    estadoJuego.manos[lado] = mano.filter((instancia) => !seleccionDescarte.has(instancia.instanciaId));
    estadoJuego.descarte[lado].push(...descartadas);
    manos.renderizarMano(lado);
    mazos.actualizarContadoresPartida();
    mazos.renderizarPanelZona();
    sonidos.descartar?.();
    elementos.faseDescarteOverlay.classList.add("oculto");
    delete document.body.dataset.discardMode;
    delete document.body.dataset.discardSide;
    faseDescarteActiva = null;
    seleccionDescarte = new Set();
    resolve();
  });

  // --------------------------------
  // TURNOS
  // --------------------------------

  let mesa = null;
  const turnos = crearSistemaTurnos(elementos, {
    ajustarEnergia: energia.ajustarEnergia,
    alFinalizarPartida: mostrarResultado,
    robarManosIniciales: mazos.robarManosIniciales,
    robarManoAtacante: (lado) => mazos.robarHasta(lado, 7),
    solicitarDescarte,
    alIniciarTurnoActor: (lado) => mesa?.reiniciarRegistroTurno(lado),
    alFinalizarRonda: () => {
      mesa?.descartarMesa();
      mazos.actualizarContadoresPartida();
      mazos.renderizarPanelZona();
    },
    sonidos,
  });

  // --------------------------------
  // MESA
  // --------------------------------

  mesa = crearSistemaMesa(elementos, {
    construirFichaCarta: manos.construirFichaCarta,
    abrirVisorCarta: visor.abrirVisorCarta,
    renderizarMano: manos.renderizarMano,
    actualizarBotonDescartar: () => {},
    puedeJugar: turnos.puedeJugar,
    esTurnoAtaque: turnos.esTurnoAtaque,
    ajustarEnergia: energia.ajustarEnergia,
    sonidos,
  });

  mesa.configurarSlotsLado("jugador");
  mesa.configurarSlotsLado("rival");
  mesa.configurarArrastreManos();

  // --------------------------------
  // EVENTOS
  // --------------------------------

  configurarEventos(elementos, {
    ...mazos,
    iniciarPartida: turnos.iniciarPartida,
    sonidos,
  });

  // --------------------------------
  // REINICIAR PARTIDA
  // --------------------------------

  async function reiniciarPartida() {
    sonidos.reiniciar();
    // Cerrar cualquier visor o fase temporal abierta.
    visor.cerrarVisorCarta();
    if (faseDescarteActiva) {
      elementos.faseDescarteOverlay.classList.add("oculto");
      delete document.body.dataset.discardMode;
      delete document.body.dataset.discardSide;
      faseDescarteActiva.resolve?.();
      faseDescarteActiva = null;
      seleccionDescarte.clear();
    }
    elementos.panelZonaOverlay?.classList.add("oculto");

    // Ocultar la pantalla de resultado.
    elementos.pantallaResultado.classList.add("oculto");

    elementos.pantallaResultado.classList.remove(
      "resultado-victoria",
      "resultado-derrota",
      "resultado-empate"
    );

    // Restaurar todos los datos de la partida.
    reiniciarEstadoJuego();
    mazos.prepararMazosDePartida();

    // Restaurar energía visual.
    energia.renderizarEnergia();

    // Limpiar las cartas de la mesa.
    mesa.limpiarMesa();

    // Limpiar las manos visuales.
    manos.renderizarMano("jugador");
    manos.renderizarMano("rival");

    // Volver a mostrar el estado inicial de los turnos.
    await turnos.reiniciarTurnos();
  }

  elementos.btnReiniciar.addEventListener(
    "click",
    reiniciarPartida
  );

  async function volverAlMenuPrincipal() {
    // Limpia el combate sin repartir una mano nueva: la siguiente partida
    // comenzará desde cero y conservará únicamente el mazo construido.
    visor.cerrarVisorCarta();
    if (faseDescarteActiva) {
      elementos.faseDescarteOverlay.classList.add("oculto");
      delete document.body.dataset.discardMode;
      delete document.body.dataset.discardSide;
      faseDescarteActiva.resolve?.();
      faseDescarteActiva = null;
      seleccionDescarte.clear();
    }
    elementos.pantallaResultado.classList.add("oculto");
    elementos.panelZonaOverlay?.classList.add("oculto");
    reiniciarEstadoJuego();
    energia.renderizarEnergia();
    mesa.limpiarMesa();
    manos.renderizarMano("jugador");
    manos.renderizarMano("rival");
    mazos.actualizarContadoresPartida();
    mazos.renderizarPanelZona();
    elementos.pantallaJuego.classList.add("oculto");
    elementos.pantallaInicio.classList.remove("oculto");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  elementos.btnMenuPrincipal.addEventListener("click", volverAlMenuPrincipal);

  // --------------------------------
  // CONFIGURACIÓN IN-GAME
  // --------------------------------
  const btnConfiguracion = document.getElementById("btn-configuracion");
  const configuracionOverlay = document.getElementById("configuracion-overlay");
  const configuracionBackdrop = document.getElementById("configuracion-backdrop");
  const toggleSonido = document.getElementById("toggle-sonido");
  const togglePantallaCompleta = document.getElementById("toggle-pantalla-completa");
  const estadoPantallaCompleta = document.getElementById("estado-pantalla-completa");
  const btnConfiguracionVolver = document.getElementById("configuracion-volver");

  function actualizarToggleSonido() {
    const activo = sonidos.estaActivo();
    toggleSonido.setAttribute("aria-checked", String(activo));
    toggleSonido.setAttribute("aria-label", activo ? "Desactivar sonido" : "Activar sonido");
    const icono = configuracionOverlay.querySelector(".configuracion-icono-sonido");
    icono.textContent = activo ? "🔊" : "🔇";
  }

  function actualizarTogglePantallaCompleta() {
    const activa = Boolean(document.fullscreenElement);
    togglePantallaCompleta.setAttribute("aria-checked", String(activa));
    togglePantallaCompleta.setAttribute("aria-label", activa ? "Salir de pantalla completa" : "Activar pantalla completa");
    togglePantallaCompleta.title = activa ? "Salir de pantalla completa" : "Activar pantalla completa";
    estadoPantallaCompleta.textContent = activa ? "PANTALLA COMPLETA ACTIVADA" : "PANTALLA COMPLETA DESACTIVADA";
  }

  async function alternarPantallaCompleta() {
    if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
      estadoPantallaCompleta.textContent = "NO DISPONIBLE EN ESTE NAVEGADOR";
      return;
    }
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn("No se pudo cambiar el modo de pantalla completa:", error);
      estadoPantallaCompleta.textContent = "EL NAVEGADOR NO PERMITIÓ EL CAMBIO";
      return;
    }
    actualizarTogglePantallaCompleta();
  }

  function abrirConfiguracion() {
    if (configuracionOverlay.classList.contains("oculto")) {
      configuracionOverlay.classList.remove("oculto");
      btnConfiguracion.setAttribute("aria-expanded", "true");
      actualizarToggleSonido();
      actualizarTogglePantallaCompleta();
      sonidos.menuAbrir?.();
      toggleSonido.focus();
    }
  }

  function cerrarConfiguracion() {
    if (!configuracionOverlay.classList.contains("oculto")) {
      configuracionOverlay.classList.add("oculto");
      btnConfiguracion.setAttribute("aria-expanded", "false");
      btnConfiguracion.focus();
      sonidos.menuCerrar?.();
    }
  }

  btnConfiguracion.addEventListener("click", abrirConfiguracion);
  configuracionBackdrop.addEventListener("click", cerrarConfiguracion);
  toggleSonido.addEventListener("click", () => {
    const activar = !sonidos.estaActivo();
    sonidos.setActivo(activar);
    actualizarToggleSonido();
    if (activar) sonidos.menuAbrir?.();
  });
  togglePantallaCompleta.addEventListener("click", alternarPantallaCompleta);
  document.addEventListener("fullscreenchange", actualizarTogglePantallaCompleta);
  btnConfiguracionVolver.addEventListener("click", async () => {
    cerrarConfiguracion();
    await volverAlMenuPrincipal();
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !configuracionOverlay.classList.contains("oculto")) {
      cerrarConfiguracion();
    }
  });

  elementos.btnPasar.addEventListener(
    "click",
    turnos.pasarTurno
  );

  // --------------------------------
  // ESTADO INICIAL
  // --------------------------------

  mazos.cargarCatalogo();
  mazos.renderizarAdministrador();
  manos.renderizarMano("jugador");
  manos.renderizarMano("rival");

  mesa.renderizarMesaLado("jugador");
  mesa.renderizarMesaLado("rival");

  energia.renderizarEnergia();

  // --------------------------------
  // ACCESO DESDE CONSOLA
  // --------------------------------

  window.juegoDBZ = {
    estado: estadoJuego,

    ...energia,
    ...visor,
    ...mazos,
    ...turnos,
    sonidos,

    reiniciarPartida,

    renderizarMano: manos.renderizarMano,
    renderizarMesaLado: mesa.renderizarMesaLado,
    limpiarMesa: mesa.limpiarMesa,
  };
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarJuego);
} else {
  iniciarJuego();
}