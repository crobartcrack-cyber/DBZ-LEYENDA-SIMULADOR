import { estadoJuego } from "./estado.js";

export function crearSistemaEnergia(elementos, sonidos = {}) {
  const {
    valorEnergiaJugador,
    valorEnergiaRival,
    energiaJugadorEl,
    energiaRivalEl
  } = elementos;

  const badges = {
    jugador: energiaJugadorEl,
    rival: energiaRivalEl
  };

  function animarCambio(lado, delta, anterior, actual) {
    const badge = badges[lado];
    if (!badge || !delta) return;

    const perdiendo = delta < 0;
    badge.classList.remove("energia-danada", "energia-recuperada");
    // Reinicia la animación incluso cuando se reciben impactos consecutivos.
    void badge.offsetWidth;
    badge.classList.add(perdiendo ? "energia-danada" : "energia-recuperada");

    const indicador = document.createElement("span");
    indicador.className = `energia-popup ${perdiendo ? "energia-popup-dano" : "energia-popup-curacion"}`;
    indicador.textContent = `${perdiendo ? "−" : "+"}${Math.abs(actual - anterior)}`;
    badge.appendChild(indicador);
    indicador.addEventListener("animationend", () => indicador.remove(), { once: true });
    window.setTimeout(() => {
      badge.classList.remove("energia-danada", "energia-recuperada");
      indicador.remove();
    }, 1050);
  }

  function renderizarEnergia() {
    valorEnergiaJugador.textContent = estadoJuego.energia.jugador;
    valorEnergiaRival.textContent = estadoJuego.energia.rival;
  }

  function setEnergia(lado, nuevoValor) {
    if (lado !== "jugador" && lado !== "rival") return;

    const anterior = estadoJuego.energia[lado];
    estadoJuego.energia[lado] = Math.max(0, Number(nuevoValor) || 0);
    renderizarEnergia();
    animarCambio(lado, estadoJuego.energia[lado] - anterior, anterior, estadoJuego.energia[lado]);
  }

  function ajustarEnergia(lado, delta) {
    if (lado !== "jugador" && lado !== "rival") return;
    const cambio = Number(delta) || 0;
    setEnergia(lado, estadoJuego.energia[lado] + cambio);
  }

  renderizarEnergia();

  return {
    renderizarEnergia,
    setEnergia,
    ajustarEnergia
  };
}
