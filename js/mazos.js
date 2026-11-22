import { estadoJuego, CARTAS_RESPALDO } from "./estado.js";
import { crearImagenCarta, precargarImagenesCartas } from "./imagenes.js";

const MINIMO_MAZO = 40;
const TAMANO_MANO = 7;
const ESPERA_ROBO_MS = 520;

export function crearSistemaMazos(elementos, { agregarCartaAMano, abrirVisorCarta, sonidos = {} }) {
  const contador = elementos.contadorMazo;
  const barra = elementos.mazoProgresoBarra;
  const estado = elementos.mazoEstado;
  const gridMazo = elementos.mazoConstruccionGrid;
  const vacio = elementos.mazoVacio;
  const catalogoGrid = elementos.constructorCatalogo;
  const btnJugar = elementos.btnJugar;
  const requisito = elementos.requisitoMazo;
  const panelOverlay = elementos.panelZonaOverlay;
  const panelTitulo = elementos.panelZonaTitulo;
  const panelSubtitulo = elementos.panelZonaSubtitulo;
  const panelGrid = elementos.panelZonaGrid;
  const panelCerrar = elementos.panelZonaCerrar;

  const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const lados = ["jugador", "rival"];

  function numeroOrden(valor) {
    const numero = Number(String(valor ?? "").trim().replace(",", "."));
    return Number.isFinite(numero) ? numero : Number.POSITIVE_INFINITY;
  }

  function compararCartas(a, b) {
    const esfera = numeroOrden(a?.ESFERA) - numeroOrden(b?.ESFERA);
    return esfera || (numeroOrden(a?.ID) - numeroOrden(b?.ID));
  }

  function ordenarMazoConstruido() {
    estadoJuego.mazoConstruido.sort(compararCartas);
  }

  async function cargarCatalogo() {
    try {
      const resp = await fetch("./data/cartas_exp1.json", { cache: "no-store" });
      if (!resp.ok) throw new Error("No se pudo cargar el catálogo");
      const data = await resp.json();
      if (!Array.isArray(data) || !data.length) throw new Error("Catálogo vacío");
      estadoJuego.catalogo = data.map((raw, index) => ({
        ...raw,
        ID: raw?.ID ?? index + 1,
        NOMBRE: String(raw?.NOMBRE ?? `CARTA ${raw?.ID ?? index + 1}`).trim(),
      })).filter((c) => String(c.ID).trim() !== "");
    } catch (error) {
      console.warn("Se utilizará el catálogo de respaldo:", error);
      estadoJuego.catalogo = CARTAS_RESPALDO.map((c) => ({ ...c }));
    }
    await precargarImagenesCartas(estadoJuego.catalogo);
    renderizarCatalogoConstructor();
    renderizarMazoConstruido();
  }

  function actualizarProgreso() {
    const total = estadoJuego.mazoConstruido.length;
    const listo = total >= MINIMO_MAZO;
    contador.textContent = total;
    barra.style.width = `${Math.min(100, total / MINIMO_MAZO * 100)}%`;
    estado.textContent = listo ? "✦ MAZO COMPLETO · LISTO PARA EL COMBATE" : `AGREGÁ ${MINIMO_MAZO - total} CARTAS MÁS PARA DESBLOQUEAR EL COMBATE`;
    estado.classList.toggle("mazo-listo", listo);
    btnJugar.disabled = !listo;
    requisito.textContent = listo ? "TU MAZO ESTÁ LISTO. ¡QUE COMIENCE EL COMBATE!" : `NECESITÁS AL MENOS ${MINIMO_MAZO} CARTAS`;
    requisito.classList.toggle("requisito-listo", listo);
    vacio.classList.toggle("oculto", total > 0);
  }

  async function animarCarta(origen, destino) {
    if (!origen || !destino) return;
    const a = origen.getBoundingClientRect();
    const b = destino.getBoundingClientRect();
    if (!a.width || !b.width) return;
    const img = destino.querySelector("img");
    if (!img) return;
    try {
      if (!img.complete || !img.naturalWidth) await new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
      if (img.decode) await img.decode().catch(() => {});
    } catch (_) {}
    const vuelo = document.createElement("div");
    vuelo.className = "carta-vuelo carta-vuelo-mazo";
    const imagenVuelo = img.cloneNode(false);
    imagenVuelo.src = img.currentSrc || img.src;
    imagenVuelo.loading = "eager";
    vuelo.appendChild(imagenVuelo);
    vuelo.style.left = `${a.left + a.width / 2}px`;
    vuelo.style.top = `${a.top + a.height / 2}px`;
    vuelo.style.width = `${b.width}px`;
    vuelo.style.height = `${b.height}px`;
    document.body.appendChild(vuelo);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    vuelo.animate([
      { transform: "translate(-50%,-50%) scale(.72) rotate(-9deg)", opacity: .35, filter: "brightness(2) drop-shadow(0 0 18px #ffbe0b)" },
      { transform: `translate(${dx * .72}px,${dy * .72}px) translate(-50%,-50%) scale(1.08) rotate(5deg)`, opacity: 1, offset: .78 },
      { transform: `translate(${dx}px,${dy}px) translate(-50%,-50%) scale(1) rotate(0)`, opacity: 1 }
    ], { duration: 520, easing: "cubic-bezier(.18,.8,.22,1)" }).onfinish = () => {
      vuelo.remove();
      destino.classList.add("carta-agregada-pulso");
      setTimeout(() => destino.classList.remove("carta-agregada-pulso"), 650);
    };
  }

  function configurarPulsacionLarga(elemento, carta) {
    let temporizador = null;
    let mantenerAbierto = false;
    let suprimirClick = false;
    const cancelar = () => { if (temporizador !== null) clearTimeout(temporizador); temporizador = null; };
    elemento.addEventListener("pointerdown", (evento) => {
      if (evento.pointerType === "mouse" && evento.button !== 0) return;
      mantenerAbierto = false;
      cancelar();
      temporizador = setTimeout(() => {
        mantenerAbierto = true;
        suprimirClick = true;
        setTimeout(() => { suprimirClick = false; mantenerAbierto = false; }, 1100);
        abrirVisorCarta(carta);
      }, 430);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((tipo) => elemento.addEventListener(tipo, cancelar));
    elemento.addEventListener("click", (evento) => {
      if (suprimirClick || mantenerAbierto) {
        evento.preventDefault(); evento.stopImmediatePropagation();
        suprimirClick = false; mantenerAbierto = false;
      }
    }, true);
    elemento.addEventListener("contextmenu", (evento) => evento.preventDefault());
  }

  function agregarAlMazo(carta, origen) {
    const nuevaCarta = { ...carta };
    estadoJuego.mazoConstruido.push(nuevaCarta);
    ordenarMazoConstruido();
    renderizarMazoConstruido();
    const destino = gridMazo.children[estadoJuego.mazoConstruido.indexOf(nuevaCarta)];
    animarCarta(origen, destino);
    sonidos.colocar?.();
  }

  function quitarDelMazo(indice) {
    if (indice < 0 || indice >= estadoJuego.mazoConstruido.length) return;
    estadoJuego.mazoConstruido.splice(indice, 1);
    ordenarMazoConstruido();
    sonidos.retirar?.();
    renderizarMazoConstruido();
  }

  function renderizarMazoConstruido() {
    ordenarMazoConstruido();
    gridMazo.innerHTML = "";
    estadoJuego.mazoConstruido.forEach((carta, indice) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "carta-mazo-construido";
      item.title = `Quitar ${carta.NOMBRE} del mazo`;
      item.setAttribute("aria-label", `Quitar ${carta.NOMBRE} del mazo`);
      item.appendChild(crearImagenCarta(carta.ID, carta.NOMBRE, "carta-img"));
      const numero = document.createElement("span");
      numero.className = "numero-carta-mazo";
      numero.textContent = String(indice + 1).padStart(2, "0");
      item.appendChild(numero);
      item.addEventListener("click", () => quitarDelMazo(indice));
      configurarPulsacionLarga(item, carta);
      gridMazo.appendChild(item);
    });
    actualizarProgreso();
  }

  function renderizarCatalogoConstructor() {
    catalogoGrid.innerHTML = "";
    estadoJuego.catalogo.forEach((carta) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "carta-catalogo constructor-carta";
      item.dataset.id = String(carta.ID);
      item.title = `[ID: ${carta.ID}] ${carta.NOMBRE}`;
      item.appendChild(crearImagenCarta(carta.ID, carta.NOMBRE, "carta-img"));
      item.addEventListener("click", () => agregarAlMazo(carta, item));
      configurarPulsacionLarga(item, carta);
      catalogoGrid.appendChild(item);
    });
  }

  function mezclar(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  function prepararMazosDePartida() {
    const base = estadoJuego.mazoConstruido.map((c) => ({ ...c }));
    estadoJuego.mazosPartida = { jugador: mezclar(base), rival: mezclar(base) };
    actualizarContadoresPartida();
    renderizarPanelZona();
  }

  function actualizarContadoresPartida() {
    for (const lado of lados) {
      const boton = lado === "jugador" ? elementos.mazoJugadorBtn : elementos.mazoRivalBtn;
      if (!boton) continue;
      boton.dataset.restantes = estadoJuego.mazosPartida[lado].length;
      boton.title = `${lado === "jugador" ? "Tu" : "Mazo rival"}: ${estadoJuego.mazosPartida[lado].length} cartas restantes · Ver cartas`;
    }
    if (elementos.descarteJugadorBtn) elementos.descarteJugadorBtn.dataset.restantes = estadoJuego.descarte.jugador.length;
    if (elementos.descarteRivalBtn) elementos.descarteRivalBtn.dataset.restantes = estadoJuego.descarte.rival.length;
  }

  function animarReciclaje(lado) {
    const boton = lado === "jugador" ? elementos.mazoJugadorBtn : elementos.mazoRivalBtn;
    const descarte = lado === "jugador" ? elementos.descarteJugadorBtn : elementos.descarteRivalBtn;
    [boton, descarte].filter(Boolean).forEach((el) => {
      el.classList.remove("mazo-reciclando"); void el.offsetWidth; el.classList.add("mazo-reciclando");
      setTimeout(() => el.classList.remove("mazo-reciclando"), 1100);
    });
    sonidos.reciclar?.();
  }

  function reciclarDescarte(lado) {
    const pila = estadoJuego.descarte[lado];
    if (!pila.length) return false;
    estadoJuego.mazosPartida[lado].push(...pila.splice(0).map((item) => item?.carta || item));
    estadoJuego.mazosPartida[lado] = mezclar(estadoJuego.mazosPartida[lado]);
    animarReciclaje(lado);
    actualizarContadoresPartida();
    renderizarPanelZona();
    return true;
  }

  function robarCarta(lado) {
    if (!lados.includes(lado)) return false;
    if (!estadoJuego.mazosPartida[lado].length) reciclarDescarte(lado);
    const mazo = estadoJuego.mazosPartida[lado];
    if (!mazo.length) return false;
    const carta = mazo.shift();
    const origen = lado === "rival" ? elementos.mazoRivalBtn : elementos.mazoJugadorBtn;
    agregarCartaAMano(lado, carta, origen);
    actualizarContadoresPartida();
    renderizarPanelZona();
    return true;
  }

  async function robarHasta(lado, cantidad = TAMANO_MANO) {
    let robadas = 0;
    while (estadoJuego.manos[lado].length < cantidad) {
      if (!robarCarta(lado)) break;
      robadas++;
      await esperar(ESPERA_ROBO_MS);
    }
    return robadas;
  }

  async function robarManosIniciales() {
    await Promise.all(lados.map((lado) => robarHasta(lado, TAMANO_MANO)));
  }

  function abrirPanelZona(tipo, lado) {
    if (!panelOverlay || !panelGrid) return;
    panelOverlay.dataset.tipo = tipo;
    panelOverlay.dataset.lado = lado;
    panelTitulo.textContent = tipo === "descarte" ? "PILA DE DESCARTE" : "MAZO";
    panelSubtitulo.textContent = lado === "jugador" ? "TUS CARTAS · ORDENADAS POR ESFERA E ID" : "CARTAS DEL RIVAL · ORDENADAS POR ESFERA E ID";
    panelOverlay.classList.remove("oculto");
    renderizarPanelZona();
    sonidos.menuAbrir?.();
  }

  function cerrarPanelZona() {
    panelOverlay?.classList.add("oculto");
    sonidos.menuCerrar?.();
  }

  function renderizarPanelZona() {
    if (!panelOverlay || panelOverlay.classList.contains("oculto")) return;
    const tipo = panelOverlay.dataset.tipo || "mazo";
    const lado = panelOverlay.dataset.lado || "jugador";
    const cartas = (tipo === "descarte" ? estadoJuego.descarte[lado].map((item) => item?.carta || item) : estadoJuego.mazosPartida[lado]).slice().sort(compararCartas);
    panelGrid.innerHTML = "";
    if (!cartas.length) {
      const vacioPanel = document.createElement("div");
      vacioPanel.className = "panel-zona-vacio";
      vacioPanel.textContent = tipo === "descarte" ? "LA PILA DE DESCARTE ESTÁ VACÍA" : "NO QUEDAN CARTAS EN EL MAZO";
      panelGrid.appendChild(vacioPanel);
    } else {
      cartas.forEach((carta, indice) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "panel-zona-carta";
        item.title = `[ESFERA ${carta.ESFERA ?? "—"}] [ID ${carta.ID}] ${carta.NOMBRE}`;
        item.appendChild(crearImagenCarta(carta.ID, carta.NOMBRE, "carta-img"));
        const info = document.createElement("span");
        info.textContent = carta.NOMBRE || `ID ${carta.ID}`;
        item.appendChild(info);
        item.addEventListener("click", () => abrirVisorCarta(carta));
        panelGrid.appendChild(item);
      });
    }
    panelSubtitulo.textContent = `${lado === "jugador" ? "TUS CARTAS" : "CARTAS DEL RIVAL"} · ${cartas.length} DISPONIBLES · ORDEN ESFERA / ID`;
  }

  elementos.mazoJugadorBtn?.addEventListener("click", () => abrirPanelZona("mazo", "jugador"));
  elementos.mazoRivalBtn?.addEventListener("click", () => abrirPanelZona("mazo", "rival"));
  elementos.descarteJugadorBtn?.addEventListener("click", () => abrirPanelZona("descarte", "jugador"));
  elementos.descarteRivalBtn?.addEventListener("click", () => abrirPanelZona("descarte", "rival"));
  panelCerrar?.addEventListener("click", cerrarPanelZona);
  panelOverlay?.addEventListener("click", (e) => { if (e.target === panelOverlay) cerrarPanelZona(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panelOverlay && !panelOverlay.classList.contains("oculto")) cerrarPanelZona(); });

  return {
    cargarCatalogo, renderizarCatalogoConstructor, renderizarMazoConstruido,
    prepararMazosDePartida, robarCarta, robarHasta, robarManosIniciales,
    reciclarDescarte, actualizarContadoresPartida, renderizarPanelZona,
    tieneMazoValido: () => estadoJuego.mazoConstruido.length >= MINIMO_MAZO,
  };
}
