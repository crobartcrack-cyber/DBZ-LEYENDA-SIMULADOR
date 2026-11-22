import { estadoJuego } from "./estado.js";

export function crearSistemaTurnos(elementos, {
  ajustarEnergia,
  alFinalizarPartida = () => {},
  robarManosIniciales = async () => {},
  robarManoAtacante = async () => {},
  solicitarDescarte = async () => {},
  alFinalizarRonda = () => {},
  alIniciarTurnoActor = () => {},
  sonidos = {},
}) {
  const { numeroRonda, textoTurno, textoAccion, btnPasar } = elementos;
  let ronda = 1;
  let turnoActual = 0;
  let atacanteRonda = null;
  let partidaIniciada = false;
  let partidaFinalizada = false;
  let preparandoRonda = false;
  let procesandoTurno = false;

  function obtenerActorActual() {
    if (!partidaIniciada || partidaFinalizada) return null;
    return turnoActual === 0 ? atacanteRonda : (atacanteRonda === "jugador" ? "rival" : "jugador");
  }

  function puedeJugar(lado) {
    return partidaIniciada && !partidaFinalizada && !preparandoRonda && !procesandoTurno && obtenerActorActual() === lado;
  }

  function actualizarInterfaz() {
    numeroRonda.textContent = ronda;
    if (preparandoRonda || procesandoTurno) {
      textoTurno.textContent = "PREPARANDO RONDA";
      textoAccion.textContent = preparandoRonda ? "ROBANDO CARTAS…" : "DESCARTANDO…";
      textoTurno.classList.remove("turno-jugador", "turno-rival");
      if (btnPasar) btnPasar.disabled = true;
      return;
    }
    const actorActual = obtenerActorActual();
    if (!actorActual) {
      textoTurno.textContent = "PARTIDA FINALIZADA";
      textoAccion.textContent = "";
      textoTurno.classList.remove("turno-jugador", "turno-rival");
      if (btnPasar) btnPasar.disabled = true;
      return;
    }
    const esJugador = actorActual === "jugador";
    const estaAtacando = actorActual === atacanteRonda;
    textoTurno.textContent = esJugador ? "TU TURNO:" : "TURNO RIVAL:";
    textoTurno.classList.toggle("turno-jugador", esJugador);
    textoTurno.classList.toggle("turno-rival", !esJugador);
    textoAccion.textContent = estaAtacando ? (esJugador ? "ATACAS" : "ATACA") : (esJugador ? "DEFIENDETE" : "SE DEFIENDE");
    if (btnPasar) btnPasar.disabled = false;
  }

  function calcularTotal(lado, atributo) {
    return Object.values(estadoJuego.mesa[lado] || {}).reduce((total, ocupante) => {
      for (const carta of [ocupante?.esfera?.carta, ocupante?.carta?.carta]) {
        if (String(carta?.TIPO || "").trim().toUpperCase() !== "ATAQUE") continue;
        const valor = Number(carta[atributo]);
        if (Number.isFinite(valor)) total += valor;
      }
      return total;
    }, 0);
  }

  function finalizarPartida(ganador) {
    if (partidaFinalizada) return;
    partidaFinalizada = true;
    partidaIniciada = false;
    actualizarInterfaz();
    if (ganador === "jugador") sonidos.victoria?.();
    else if (ganador === "rival") sonidos.derrota?.();
    else sonidos.empate?.();
    alFinalizarPartida({
      ganador,
      perdedor: ganador === "jugador" ? "rival" : "jugador",
      energiaJugador: estadoJuego.energia.jugador,
      energiaRival: estadoJuego.energia.rival,
    });
  }

  function comprobarFinPartida() {
    const j = estadoJuego.energia.jugador;
    const r = estadoJuego.energia.rival;
    if (j <= 0 && r <= 0) { finalizarPartida("empate"); return true; }
    if (r <= 0) { finalizarPartida("jugador"); return true; }
    if (j <= 0) { finalizarPartida("rival"); return true; }
    return false;
  }

  async function resolverCombateRonda() {
    const atacante = atacanteRonda;
    const defensor = atacante === "jugador" ? "rival" : "jugador";
    const totalAtaque = calcularTotal(atacante, "ATAQUE");
    const totalDefensa = calcularTotal(defensor, "DEFENSA");
    const dano = Math.max(0, totalAtaque - totalDefensa);
    if (dano > 0) { sonidos.ataque?.(); ajustarEnergia(defensor, -dano); }
    else if (totalAtaque > 0) sonidos.bloqueo?.();
    const resultado = { atacante, defensor, totalAtaque, totalDefensa, dano };
    const termino = comprobarFinPartida();
    // La mesa se descarta DESPUÉS de calcular el combate, incluso en la ronda final.
    alFinalizarRonda(resultado);
    return { ...resultado, termino };
  }

  async function iniciarPartida() {
    ronda = 1;
    turnoActual = 0;
    atacanteRonda = Math.random() < 0.5 ? "jugador" : "rival";
    partidaFinalizada = false;
    partidaIniciada = true;
    preparandoRonda = true;
    actualizarInterfaz();
    try { await robarManosIniciales(); }
    finally { preparandoRonda = false; alIniciarTurnoActor(atacanteRonda, true); actualizarInterfaz(); }
  }

  function reiniciarTurnos() { return iniciarPartida(); }

  async function pasarTurno() {
    if (!partidaIniciada || partidaFinalizada || preparandoRonda || procesandoTurno) return;
    const actorQueFinaliza = obtenerActorActual();
    if (!actorQueFinaliza) return;

    procesandoTurno = true;
    actualizarInterfaz();
    sonidos.pasar?.();
    try {
      const cartasEnMesa = Object.keys(estadoJuego.mesa[actorQueFinaliza] || {}).length;
      const cartasEnMano = estadoJuego.manos[actorQueFinaliza]?.length || 0;
      const sinJugar = cartasEnMesa === 0;
      // Si no bajó ninguna carta, descarta al menos dos. Si además supera siete,
      // se descarta lo necesario para cumplir ambos requisitos en una sola fase.
      const excedente = Math.max(0, cartasEnMano - 7);
      const cantidadObligatoria = Math.min(cartasEnMano, Math.max(sinJugar ? 2 : 0, excedente));
      // El descarte obligatorio se evalúa únicamente al finalizar el turno atacante.
      if (actorQueFinaliza === atacanteRonda && cantidadObligatoria > 0) {
        await solicitarDescarte(actorQueFinaliza, cantidadObligatoria, {
          sinJugar,
          excedente,
        });
      }
    } finally {
      procesandoTurno = false;
    }

    if (turnoActual === 0) {
      turnoActual = 1;
      alIniciarTurnoActor(obtenerActorActual(), false);
      sonidos.turno?.();
    } else {
      await resolverCombateRonda();
      if (partidaFinalizada) { actualizarInterfaz(); return; }
      turnoActual = 0;
      ronda++;
      atacanteRonda = atacanteRonda === "jugador" ? "rival" : "jugador";
      preparandoRonda = true;
      actualizarInterfaz();
      try { await robarManoAtacante(atacanteRonda); }
      finally { preparandoRonda = false; alIniciarTurnoActor(atacanteRonda, true); }
      sonidos.turno?.();
    }
    actualizarInterfaz();
  }

  return {
    iniciarPartida, reiniciarTurnos, pasarTurno, actualizarInterfaz,
    obtenerActorActual, puedeJugar, calcularTotal, resolverCombateRonda, comprobarFinPartida,
    esTurnoAtaque: (lado) => partidaIniciada && !partidaFinalizada && turnoActual === 0 && atacanteRonda === lado && obtenerActorActual() === lado,
  };
}
