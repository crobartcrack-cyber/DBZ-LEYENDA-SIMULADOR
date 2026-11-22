// Audio procedural para DBZ Leyenda. Sin archivos de audio ni librerías externas.
export function crearSistemaSonidos(elementos = {}) {
  let contexto = null, master = null, habilitado = true, volumen = 0.48, ultimoDrag = 0;

  try { habilitado = localStorage.getItem("dbz-sonido-activo") !== "false"; } catch (_) {}

  function prepararAudio() {
    if (contexto) return contexto;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    contexto = new AudioContextClass();
    master = contexto.createGain();
    master.gain.value = habilitado ? volumen : 0;
    master.connect(contexto.destination);
    return contexto;
  }

  async function desbloquear() {
    const ctx = prepararAudio();
    if (ctx && ctx.state === "suspended") {
      try { await ctx.resume(); } catch (_) {}
    }
  }


  function setActivo(valor) {
    habilitado = Boolean(valor);
    try { localStorage.setItem("dbz-sonido-activo", String(habilitado)); } catch (_) {}
    if (master && contexto) {
      master.gain.cancelScheduledValues(contexto.currentTime);
      master.gain.setTargetAtTime(habilitado ? volumen : 0, contexto.currentTime, 0.035);
    }
    if (habilitado) desbloquear();
  }

  function setVolumen(valor) {
    volumen = Math.max(0, Math.min(1, Number(valor) || 0));
    if (master && contexto && habilitado) master.gain.setTargetAtTime(volumen, contexto.currentTime, 0.03);
  }

  function tono(freq, inicio, duracion, forma = "sine", nivel = 0.22, freqFinal = null) {
    const ctx = prepararAudio();
    if (!ctx || !master || !habilitado) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = forma;
    osc.frequency.setValueAtTime(Math.max(20, freq), inicio);
    if (freqFinal) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqFinal), inicio + duracion);
    gain.gain.setValueAtTime(0.0001, inicio);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, nivel), inicio + Math.min(0.018, duracion * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
    osc.connect(gain); gain.connect(master);
    osc.start(inicio); osc.stop(inicio + duracion + 0.025);
  }

  function ruido(inicio, duracion, nivel = 0.12, filtro = 1200) {
    const ctx = prepararAudio();
    if (!ctx || !master || !habilitado) return;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * duracion));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate), datos = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const fuente = ctx.createBufferSource(), paso = ctx.createBiquadFilter(), gain = ctx.createGain();
    fuente.buffer = buffer; paso.type = "lowpass"; paso.frequency.value = filtro;
    gain.gain.setValueAtTime(nivel, inicio);
    gain.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
    fuente.connect(paso); paso.connect(gain); gain.connect(master);
    fuente.start(inicio); fuente.stop(inicio + duracion);
  }

  function secuencia(pasos) {
    const ctx = prepararAudio();
    if (!ctx || !habilitado) return;
    const base = ctx.currentTime + 0.012;
    pasos.forEach(p => p.ruido
      ? ruido(base + p.t, p.d, p.n, p.f)
      : tono(p.f, base + p.t, p.d, p.tipo || "sine", p.n, p.fin || null));
  }

  const efectos = {
    desbloquear, setActivo, setVolumen, estaActivo: () => habilitado,
    inicio: () => secuencia([
      {t:0,f:330,fin:495,d:.18,tipo:"triangle",n:.16},
      {t:.12,f:495,fin:740,d:.26,tipo:"triangle",n:.18},
      {t:.22,f:990,d:.32,n:.11}
    ]),
    menuAbrir: () => secuencia([
      {t:0,f:360,fin:610,d:.13,tipo:"triangle",n:.12},
      {t:.055,f:720,d:.10,n:.055}
    ]),
    menuCerrar: () => secuencia([{t:0,f:620,fin:370,d:.14,tipo:"triangle",n:.10}]),
    robar: () => secuencia([
      {t:0,ruido:true,d:.16,n:.075,f:1900},
      {t:.025,f:420,fin:760,d:.22,tipo:"triangle",n:.14},
      {t:.13,f:920,fin:680,d:.19,n:.09}
    ]),
    inspeccionar: () => secuencia([
      {t:0,f:690,d:.075,n:.07},
      {t:.045,f:920,d:.09,n:.045}
    ]),
    arrastrar: () => {
      const ahora = performance.now();
      if (ahora - ultimoDrag < 180) return;
      ultimoDrag = ahora;
      secuencia([{t:0,ruido:true,d:.09,n:.045,f:1500},{t:0,f:250,fin:360,d:.10,tipo:"triangle",n:.045}]);
    },
    colocar: () => secuencia([
      {t:0,ruido:true,d:.11,n:.14,f:950},
      {t:0,f:150,fin:92,d:.20,n:.19},
      {t:.045,f:520,fin:310,d:.16,tipo:"triangle",n:.10},
      {t:.10,f:1040,d:.13,n:.055}
    ]),
    retirar: () => secuencia([
      {t:0,f:510,fin:330,d:.16,tipo:"triangle",n:.12},
      {t:.035,ruido:true,d:.10,n:.055,f:1200}
    ]),
    descartar: () => secuencia([
      {t:0,ruido:true,d:.22,n:.15,f:850},
      {t:.02,f:390,fin:125,d:.24,tipo:"sawtooth",n:.08}
    ]),
    // Rugido fantástico sintético y llamarada prolongada (sin archivos externos).
    ritualSieteEsferas: () => {
      const ctx = prepararAudio(); if (!ctx || !habilitado) return;
      const base = ctx.currentTime + .02;
      tono(118, base, 1.15, "sawtooth", .22, 38);
      tono(72, base + .06, 1.3, "triangle", .24, 44);
      tono(310, base + .12, .85, "sawtooth", .12, 92);
      ruido(base, 1.45, .22, 620);
      ruido(base + .22, 1.15, .14, 2100);
      secuencia([{t:.32,f:155,fin:620,d:.48,tipo:"triangle",n:.16},{t:.7,f:880,fin:190,d:.5,tipo:"sawtooth",n:.10}]);
    },
    consumirLlamas: () => secuencia([
      {t:0,ruido:true,d:.72,n:.19,f:1800},
      {t:.05,ruido:true,d:.95,n:.13,f:900},
      {t:0,f:180,fin:42,d:.8,tipo:"sawtooth",n:.14},
      {t:.35,f:620,fin:110,d:.45,tipo:"triangle",n:.08}
    ]),
    pasar: () => secuencia([
      {t:0,f:500,fin:390,d:.12,tipo:"triangle",n:.11},
      {t:.08,f:390,fin:290,d:.14,tipo:"triangle",n:.08}
    ]),
    turno: () => secuencia([
      {t:0,f:440,d:.09,n:.09},
      {t:.09,f:660,d:.15,tipo:"triangle",n:.12}
    ]),
    ataque: () => secuencia([
      {t:0,ruido:true,d:.18,n:.19,f:1700},
      {t:0,f:95,fin:48,d:.27,tipo:"sawtooth",n:.15},
      {t:.045,f:210,fin:75,d:.20,tipo:"triangle",n:.13},
      {t:.11,f:720,fin:190,d:.16,n:.07}
    ]),
    bloqueo: () => secuencia([
      {t:0,f:180,fin:85,d:.16,tipo:"triangle",n:.12},
      {t:.025,ruido:true,d:.12,n:.10,f:700},
      {t:.08,f:620,fin:360,d:.12,n:.07}
    ]),
    victoria: () => secuencia([
      {t:0,f:392,d:.16,tipo:"triangle",n:.13},
      {t:.13,f:523,d:.18,tipo:"triangle",n:.14},
      {t:.27,f:659,d:.20,tipo:"triangle",n:.15},
      {t:.43,f:784,d:.42,n:.17},
      {t:.43,f:988,d:.34,n:.07}
    ]),
    derrota: () => secuencia([
      {t:0,f:330,fin:270,d:.24,tipo:"triangle",n:.13},
      {t:.19,f:247,fin:165,d:.34,n:.15},
      {t:.43,f:130,fin:75,d:.52,tipo:"sawtooth",n:.10}
    ]),
    empate: () => secuencia([
      {t:0,f:392,d:.20,tipo:"triangle",n:.12},
      {t:.19,f:349,d:.22,tipo:"triangle",n:.12},
      {t:.40,f:392,d:.32,n:.10}
    ]),
    error: () => secuencia([
      {t:0,f:190,d:.09,tipo:"square",n:.07},
      {t:.10,f:145,d:.12,tipo:"square",n:.06}
    ]),
    reciclar: () => secuencia([
      {t:0,f:260,fin:420,d:.22,tipo:"triangle",n:.10},
      {t:.10,f:520,fin:780,d:.24,tipo:"sine",n:.12},
      {t:.24,f:920,fin:620,d:.28,tipo:"triangle",n:.09}
    ]),
    reiniciar: () => secuencia([
      {t:0,f:620,fin:420,d:.13,tipo:"triangle",n:.10},
      {t:.08,f:330,fin:520,d:.20,n:.08}
    ])
  };

  // La activación sigue disponible mediante setActivo() para una futura interfaz.
  document.addEventListener("pointerdown", desbloquear, {once:true,passive:true});
  document.addEventListener("keydown", desbloquear, {once:true});
  return efectos;
}
