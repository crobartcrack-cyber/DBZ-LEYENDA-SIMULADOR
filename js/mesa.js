import { estadoJuego } from "./estado.js";

export function crearSistemaMesa(
  elementos,
  {
    construirFichaCarta,
    abrirVisorCarta,
    renderizarMano,
    actualizarBotonDescartar,
    puedeJugar,
    sonidos = {},
    esTurnoAtaque = () => false,
    ajustarEnergia = () => {},
  }
) {
  const slots = {
    jugador: elementos.slotsJugador,
    rival: elementos.slotsRival,
  };

  function esEsferaDragon(carta) {
    return (
      String(carta?.TIPO || "").trim().toUpperCase() ===
      "ESFERAS DEL DRAGON"
    );
  }

  function coincidenEsferas(carta1, carta2) {
    if (
      carta1?.ESFERA === undefined ||
      carta2?.ESFERA === undefined
    ) {
      return false;
    }

    return String(carta1.ESFERA) === String(carta2.ESFERA);
  }

  function crearFichaConVisor(carta) {
    const ficha = construirFichaCarta(carta);

    ficha.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirVisorCarta(carta);
    });

    return ficha;
  }

  function renderizarMesaLado(lado) {
    slots[lado].forEach((slotEl) => {
      const numSlot = slotEl.dataset.slot;
      const ocupante = estadoJuego.mesa[lado][numSlot];

      const idEsfera =
        ocupante?.esfera?.instanciaId || null;

      const idCarta =
        ocupante?.carta?.instanciaId || null;

      const estadoRenderizado =
        `${idEsfera || ""}_${idCarta || ""}`;

      if (
        slotEl.dataset.estadoRenderizado ===
        estadoRenderizado
      ) {
        return;
      }

      slotEl.innerHTML = "";

      if (ocupante?.esfera) {
        const grupo = document.createElement("div");

        grupo.className = "grupo-esfera";

        const fichaEsfera = crearFichaConVisor(
          ocupante.esfera.carta
        );

        fichaEsfera.classList.add("carta-esfera-base");

        grupo.appendChild(fichaEsfera);

        if (ocupante.carta) {
          const fichaCarta = crearFichaConVisor(
            ocupante.carta.carta
          );

          fichaCarta.classList.add(
            "carta-esfera-asociada"
          );

          grupo.appendChild(fichaCarta);
        }

        slotEl.appendChild(grupo);

        slotEl.dataset.estadoRenderizado =
          estadoRenderizado;
      } else {
        delete slotEl.dataset.estadoRenderizado;
      }
    });
  }

  function limpiarMesa() {
    estadoJuego.mesa.jugador = {};
    estadoJuego.mesa.rival = {};

    for (const lado of ["jugador", "rival"]) {
      slots[lado].forEach((slotEl) => {
        slotEl.innerHTML = "";
        delete slotEl.dataset.estadoRenderizado;
      });
    }
  }

  function descartarMesa() {
    let total = 0;
    for (const lado of ["jugador", "rival"]) {
      for (const ocupante of Object.values(estadoJuego.mesa[lado] || {})) {
        if (ocupante?.esfera) { estadoJuego.descarte[lado].push(ocupante.esfera); total++; }
        if (ocupante?.carta) { estadoJuego.descarte[lado].push(ocupante.carta); total++; }
      }
      estadoJuego.mesa[lado] = {};
    }
    limpiarMesa();
    sonidos.descartar?.();
    return total;
  }

  function buscarCartaEnMano(lado, instanciaId) {
    return estadoJuego.manos[lado].findIndex(
      (item) => item.instanciaId === instanciaId
    );
  }

  function limpiarSeleccion() {
    estadoJuego.seleccionMano = {
      lado: null,
      instanciaId: null,
    };
  }

  const cartasUsadasEsteTurno = { jugador: new Set(), rival: new Set() };
  const esferasAtaqueEsteTurno = new Set();
  let efectoSieteEsferasActivado = false;

  function reiniciarRegistroTurno(lado) {
    cartasUsadasEsteTurno[lado]?.clear();
    if (lado === "jugador" || lado === "rival") {
      esferasAtaqueEsteTurno.clear();
      efectoSieteEsferasActivado = false;
    }
  }

  function colocarCarta(lado, numSlot) {
    if (!puedeJugar || !puedeJugar(lado)) {
      return false;
    }

    const seleccion = estadoJuego.seleccionMano;

    if (
      !seleccion.instanciaId ||
      seleccion.lado !== lado
    ) {
      return false;
    }

    const manoLado = estadoJuego.manos[lado];

    const indice = buscarCartaEnMano(
      lado,
      seleccion.instanciaId
    );

    if (indice === -1) {
      return false;
    }

    const instancia = manoLado[indice];
    const carta = instancia.carta;
    const claveCarta = `${carta.ID ?? carta.NOMBRE}`;
    if (!esEsferaDragon(carta) && cartasUsadasEsteTurno[lado].has(claveCarta)) return false;

    const ocupante = estadoJuego.mesa[lado][numSlot];

    if (esEsferaDragon(carta)) {
      if (ocupante) {
        return false;
      }

      manoLado.splice(indice, 1);

      estadoJuego.mesa[lado][numSlot] = {
        esfera: instancia,
        carta: null,
      };
      if (esTurnoAtaque(lado)) {
        const numeroEsfera = String(carta.ESFERA ?? carta.ID ?? "").trim();
        if (["1", "2", "3", "4", "5", "6", "7"].includes(numeroEsfera)) esferasAtaqueEsteTurno.add(numeroEsfera);
      }
    } else {
      if (!ocupante?.esfera) {
        return false;
      }

      if (ocupante.carta) {
        return false;
      }

      if (
        !coincidenEsferas(
          carta,
          ocupante.esfera.carta
        )
      ) {
        return false;
      }

      manoLado.splice(indice, 1);

      ocupante.carta = instancia;
      cartasUsadasEsteTurno[lado].add(claveCarta);
    }

    if (!esEsferaDragon(carta)) cartasUsadasEsteTurno[lado].add(claveCarta);
    limpiarSeleccion();

    // Bonus instantáneo: las siete esferas diferentes colocadas en el turno atacante.
    if (esTurnoAtaque(lado) && esferasAtaqueEsteTurno.size === 7 && !efectoSieteEsferasActivado) {
      efectoSieteEsferasActivado = true;
      const defensor = lado === "jugador" ? "rival" : "jugador";
      ajustarEnergia(defensor, -100);
      const slotsEsferas = Object.entries(estadoJuego.mesa[lado]).filter(([slot, ocupanteMesa]) =>
        ocupanteMesa?.esfera && esEsferaDragon(ocupanteMesa.esfera.carta) &&
        ["1","2","3","4","5","6","7"].includes(String(ocupanteMesa.esfera.carta.ESFERA ?? ocupanteMesa.esfera.carta.ID))
      );
      // Gran momento de las siete esferas: rugido, llamarada y vibración antes de consumirlas.
      sonidos.ritualSieteEsferas?.();
      slotsEsferas.forEach(([slot]) => {
        const slotEl = slots[lado].find(el => el.dataset.slot === String(slot));
        const grupo = slotEl?.querySelector('.grupo-esfera');
        if (grupo) grupo.classList.add('ritual-esferas-vibrar', 'ritual-esferas-llamas');
      });
      esferasAtaqueEsteTurno.clear();
      // El daño es instantáneo; la animación dura un breve momento antes de mover las cartas al descarte.
      setTimeout(() => {
        slotsEsferas.forEach(([slot, ocupanteMesa]) => {
          if (estadoJuego.mesa[lado][slot]?.esfera?.instanciaId === ocupanteMesa.esfera.instanciaId) {
            estadoJuego.descarte[lado].push(ocupanteMesa.esfera);
            delete estadoJuego.mesa[lado][slot];
          }
        });
        sonidos.consumirLlamas?.();
        slotsEsferas.forEach(([slot]) => {
          const slotEl = slots[lado].find(el => el.dataset.slot === String(slot));
          if (slotEl) delete slotEl.dataset.estadoRenderizado;
        });
        renderizarMesaLado(lado);
        actualizarBotonDescartar();
      }, 1750);
    }

    actualizarBotonDescartar();
    renderizarMano(lado);
    renderizarMesaLado(lado);
    sonidos.colocar?.();

    return true;
  }

  function retirarCarta(lado, numSlot) {
    const ocupante = estadoJuego.mesa[lado][numSlot];

    if (!ocupante?.esfera) {
      return false;
    }

    if (ocupante.carta) {
      estadoJuego.manos[lado].push(ocupante.carta);
      ocupante.carta = null;
    } else {
      estadoJuego.manos[lado].push(ocupante.esfera);
      delete estadoJuego.mesa[lado][numSlot];
    }

    actualizarBotonDescartar();
    renderizarMano(lado);
    renderizarMesaLado(lado);
    sonidos.retirar?.();

    return true;
  }

  function configurarSlotsLado(lado) {
    slots[lado].forEach((slotEl) => {
      slotEl.addEventListener("click", () => {
        const numSlot = slotEl.dataset.slot;
        const seleccion = estadoJuego.seleccionMano;

        if (
          seleccion.instanciaId &&
          seleccion.lado === lado
        ) {
          colocarCarta(lado, numSlot);
          return;
        }

        retirarCarta(lado, numSlot);
      });
    });
  }

  function esDestinoValido(lado, numSlot, instancia) {
    if (!puedeJugar || !puedeJugar(lado)) return false;
    const ocupante = estadoJuego.mesa[lado][numSlot];
    if (esEsferaDragon(instancia.carta)) return !ocupante;
    return Boolean(
      ocupante?.esfera &&
      !ocupante.carta &&
      coincidenEsferas(instancia.carta, ocupante.esfera.carta)
    );
  }

  function configurarArrastreManos() {
    for (const lado of ["jugador", "rival"]) {
      const manoEl = lado === "jugador"
        ? elementos.manoJugadorEl
        : elementos.manoRivalEl;
      let arrastre = null;
      let ghost = null;
      let inicio = null;

      manoEl.addEventListener("pointerdown", (e) => {
        if (document.body.dataset.discardMode === "true") return;
        const cartaEl = e.target.closest(".carta-mano");
        if (!cartaEl || e.button !== 0) return;
        // En mouse evitamos selección accidental. En touch, touch-action:none
        // en la carta controla el gesto y conserva el click sintético del visor.
        if (e.pointerType === "mouse") e.preventDefault();
        // manos.js captura el puntero en la propia carta; así el drag sigue
        // llegando a esta mano y los listeners de pointerup de la carta funcionan.
        const instanciaId = cartaEl.dataset.instanciaId;
        const instancia = estadoJuego.manos[lado].find((item) => item.instanciaId === instanciaId);
        if (!instancia) return;
        inicio = { x: e.clientX, y: e.clientY, cartaEl, instanciaId, instancia, pointerId: e.pointerId };
      });

      manoEl.addEventListener("pointermove", (e) => {
        if (!inicio || inicio.pointerId !== e.pointerId) return;
        const dx = e.clientX - inicio.x;
        const dy = e.clientY - inicio.y;
        if (!arrastre && Math.hypot(dx, dy) < 7) return;

        if (!arrastre) {
          arrastre = true;
          sonidos.arrastrar?.();
          const img = inicio.cartaEl.querySelector("img");
          ghost = document.createElement("div");
          ghost.className = "carta-arrastrada";
          if (img) ghost.appendChild(img.cloneNode(true));
          document.body.appendChild(ghost);
          inicio.cartaEl.classList.add("arrastrando-origen");
          document.body.classList.add("modo-arrastre");
        }

        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
        document.querySelectorAll(`.slot-carta[data-lado="${lado}"]`).forEach((slot) => {
          const valido = esDestinoValido(lado, slot.dataset.slot, inicio.instancia);
          slot.classList.toggle("slot-destino-posible", valido);
        });
        const bajoPuntero = document.elementFromPoint(e.clientX, e.clientY);
        const slot = bajoPuntero?.closest(`.slot-carta[data-lado="${lado}"]`);
        document.querySelectorAll(".slot-carta.hover-arrastre").forEach((el) => el.classList.remove("hover-arrastre"));
        if (slot && esDestinoValido(lado, slot.dataset.slot, inicio.instancia)) slot.classList.add("hover-arrastre");
      });

      const finalizarArrastre = (e, cancelado = false) => {
        if (!inicio || inicio.pointerId !== e.pointerId) return;
        if (arrastre && !cancelado) {
          const destino = document.elementFromPoint(e.clientX, e.clientY)?.closest(`.slot-carta[data-lado="${lado}"]`);
          inicio.cartaEl.dataset.skipClick = "1";
          if (destino && esDestinoValido(lado, destino.dataset.slot, inicio.instancia)) {
            estadoJuego.seleccionMano = { lado, instanciaId: inicio.instanciaId };
            colocarCarta(lado, destino.dataset.slot);
          } else {
            sonidos.error?.();
            if (destino) {
              destino.classList.remove("slot-jugada-invalida");
              void destino.offsetWidth;
              destino.classList.add("slot-jugada-invalida");
              destino.addEventListener("animationend", () => {
                destino.classList.remove("slot-jugada-invalida");
              }, { once: true });
            }
            inicio.cartaEl.classList.remove("carta-jugada-invalida");
            void inicio.cartaEl.offsetWidth;
            inicio.cartaEl.classList.add("carta-jugada-invalida");
            const cartaInvalida = inicio.cartaEl;
            cartaInvalida.addEventListener("animationend", () => {
              cartaInvalida.classList.remove("carta-jugada-invalida");
            }, { once: true });
          }
          inicio.cartaEl.classList.remove("arrastrando-origen");
          document.body.classList.remove("modo-arrastre");
          ghost?.remove();
          document.querySelectorAll(".slot-carta").forEach((slot) => slot.classList.remove("slot-destino-posible", "hover-arrastre"));
        } else if (arrastre && cancelado) {
          // Limpieza completa cuando el sistema interrumpe el gesto táctil.
          inicio.cartaEl.classList.remove("arrastrando-origen");
          document.body.classList.remove("modo-arrastre");
          ghost?.remove();
          document.querySelectorAll(".slot-carta").forEach((slot) => slot.classList.remove("slot-destino-posible", "hover-arrastre"));
        }
        inicio = null;
        arrastre = false;
        ghost = null;
      };

      manoEl.addEventListener("pointerup", (e) => finalizarArrastre(e, false));
      // Un gesto interrumpido por el sistema operativo no debe jugar la carta.
      manoEl.addEventListener("pointercancel", (e) => finalizarArrastre(e, true));
    }
  }

  return {
    renderizarMesaLado,
    configurarSlotsLado,
    configurarArrastreManos,
    limpiarMesa,
    descartarMesa,
    reiniciarRegistroTurno,
  };
}