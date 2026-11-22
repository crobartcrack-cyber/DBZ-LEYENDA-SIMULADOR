
import {
  estadoJuego,
  crearInstanciaCarta,
} from "./estado.js";

import { crearImagenCarta } from "./imagenes.js";

export function crearSistemaManos(
  elementos,
  { actualizarBotonDescartar, abrirVisorCarta, sonidos = {} }
) {
  const contenedores = {
    jugador: elementos.manoJugadorEl,
    rival: elementos.manoRivalEl,
  };

  const cartasRenderizadas = {
    jugador: new Map(),
    rival: new Map(),
  };

  function construirFichaCarta(carta) {
    const ficha = document.createElement("div");

    ficha.className = "carta-ficha";
    ficha.title = `[ID: ${carta.ID}] ${carta.NOMBRE}`;

    const img = crearImagenCarta(
      carta.ID,
      carta.NOMBRE,
      "carta-img"
    );

    ficha.appendChild(img);

    return ficha;
  }

  function crearElementoCarta(lado, instancia) {
    const cardEl = document.createElement("div");

    cardEl.className = "carta-mano";
    cardEl.dataset.instanciaId = instancia.instanciaId;

    cardEl.appendChild(construirFichaCarta(instancia.carta));

    let temporizadorVisor = null;
    let visorPorPulsacionLarga = false;
    const cancelarPulsacionLarga = () => {
      if (temporizadorVisor !== null) clearTimeout(temporizadorVisor);
      temporizadorVisor = null;
    };

    cardEl.addEventListener("click", (e) => {
      if (cardEl.dataset.skipClick === "1" || cardEl.dataset.skipDiscardClick === "1") {
        delete cardEl.dataset.skipClick;
        delete cardEl.dataset.skipDiscardClick;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // En descarte, el click lo procesa el selector global; no debe abrir el visor.
      if (document.body.dataset.discardMode === "true") return;
      e.stopPropagation();
      abrirVisorCarta(instancia.carta);
    });

    // Mantener pulsado abre el visor también durante el descarte obligatorio.
    cardEl.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      cardEl.setPointerCapture?.(e.pointerId);
      visorPorPulsacionLarga = false;
      cancelarPulsacionLarga();
      // En partida normal, la ampliación se reserva para el click.
      // La pulsación larga sigue habilitada únicamente en la fase de descarte.
      if (document.body.dataset.discardMode !== "true") return;
      temporizadorVisor = setTimeout(() => {
        visorPorPulsacionLarga = true;
        cardEl.dataset.skipClick = "1";
        cardEl.dataset.skipDiscardClick = "1";
        abrirVisorCarta(instancia.carta);
      }, 430);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((tipo) => {
      cardEl.addEventListener(tipo, () => {
        cancelarPulsacionLarga();
        if (visorPorPulsacionLarga) {
          // El click sintético posterior al pointerup no debe seleccionar ni abrir otra vez.
          cardEl.dataset.skipClick = "1";
          cardEl.dataset.skipDiscardClick = "1";
          setTimeout(() => {
            delete cardEl.dataset.skipClick;
            delete cardEl.dataset.skipDiscardClick;
            visorPorPulsacionLarga = false;
          }, 700);
        }
      });
    });

    return cardEl;
  }

  function renderizarMano(lado) {
    const contenedor = contenedores[lado];
    const mapa = cartasRenderizadas[lado];
    const instancias = estadoJuego.manos[lado];

    const idsActivos = new Set();

    instancias.forEach((instancia, indice) => {
      const id = instancia.instanciaId;

      idsActivos.add(id);

      let cardEl = mapa.get(id);

      if (!cardEl) {
        cardEl = crearElementoCarta(lado, instancia);
        mapa.set(id, cardEl);
      }

      const estaSeleccionada =
        estadoJuego.seleccionMano.lado === lado &&
        estadoJuego.seleccionMano.instanciaId === id;

      cardEl.classList.toggle(
        "seleccionada",
        estaSeleccionada
      );

      const elementoActual = contenedor.children[indice];

      if (elementoActual !== cardEl) {
        contenedor.insertBefore(
          cardEl,
          elementoActual || null
        );
      }
    });

    for (const [id, cardEl] of mapa) {
      if (!idsActivos.has(id)) {
        cardEl.remove();
        mapa.delete(id);
      }
    }
  }

  function agregarCartaAMano(lado, carta, origenMazo = null) {
    if (lado !== "jugador" && lado !== "rival") return;

    const instancia = crearInstanciaCarta(carta);

    estadoJuego.manos[lado].push(instancia);
    sonidos.robar?.();

    renderizarMano(lado);

    if (origenMazo) {
      requestAnimationFrame(() => animarDesdeMazo(lado, instancia, origenMazo));
    }
  }

  function animarDesdeMazo(lado, instancia, origenMazo) {
    const destino = cartasRenderizadas[lado].get(instancia.instanciaId);
    if (!destino || !origenMazo) return;

    const origenRect = origenMazo.getBoundingClientRect();
    const destinoRect = destino.getBoundingClientRect();
    if (!origenRect.width || !destinoRect.width) return;

    const imagen = destino.querySelector("img");
    if (!imagen) return;

    const vuelo = document.createElement("div");
    vuelo.className = "carta-vuelo";
    const imagenVuelo = imagen.cloneNode(true);
    vuelo.appendChild(imagenVuelo);
    vuelo.style.left = `${origenRect.left + origenRect.width / 2}px`;
    vuelo.style.top = `${origenRect.top + origenRect.height / 2}px`;
    vuelo.style.width = `${destinoRect.width}px`;
    vuelo.style.height = `${destinoRect.height}px`;
    const vueloX = destinoRect.left + destinoRect.width / 2 - (origenRect.left + origenRect.width / 2);
    const vueloY = destinoRect.top + destinoRect.height / 2 - (origenRect.top + origenRect.height / 2);
    document.body.appendChild(vuelo);

    destino.classList.add("carta-recibiendo");
    vuelo.animate([
      { transform: `translate(-50%, -50%) scale(${Math.max(0.45, Math.min(1.15, origenRect.width / destinoRect.width))}) rotate(-8deg)`, opacity: 0.2, filter: "brightness(1.8) drop-shadow(0 0 18px rgba(255,190,11,.9))" },
      { transform: `translate3d(${vueloX * 0.72}px, ${vueloY * 0.72}px, 0) translate(-50%, -50%) scale(1.08) rotate(4deg)`, opacity: 1, offset: 0.78 },
      { transform: `translate3d(${vueloX}px, ${vueloY}px, 0) translate(-50%, -50%) scale(1) rotate(0deg)`, opacity: 1, filter: "brightness(1) drop-shadow(0 0 8px rgba(0,229,255,.65))" }
    ], { duration: 620, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = () => {
      vuelo.remove();
      destino.classList.remove("carta-recibiendo");
      destino.animate([
        { transform: "translateY(-9px) scale(1.07)" },
        { transform: "translateY(0) scale(1)" }
      ], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" });
    };
  }

  return {
    construirFichaCarta,
    renderizarMano,
    agregarCartaAMano,
  };
}
