import { estadoJuego, CARTAS_RESPALDO } from "./estado.js";
import { crearImagenCarta, precargarImagenesCartas } from "./imagenes.js";
import { cargarDatosGuardados, guardarDatos } from "./persistencia.js";

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
  const filtrosCatalogo = {
    esfera: elementos.filtroEsfera,
    tipo: elementos.filtroTipo,
    numero: elementos.filtroNumero,
    campo: elementos.ordenCampo,
    direccion: elementos.ordenDireccion,
    limpiar: elementos.limpiarFiltros,
    resultados: elementos.catalogoResultados,
  };
  const btnJugar = elementos.btnJugar;
  const requisito = elementos.requisitoMazo;
  const admin = {
    vista: elementos.administradorMazos,
    lista: elementos.listaMazos,
    selectJugador: elementos.seleccionMazoJugador,
    toggleRival: elementos.rivalPersonalizado,
    selectRival: elementos.seleccionMazoRival,
    rivalSelector: elementos.rivalSelector,
    editor: elementos.editorMazo,
    nombreEditor: elementos.nombreMazoEditor,
    tituloEditor: elementos.tituloEditorMazo,
    volver: elementos.volverAdministrador,
    crear: elementos.crearMazo,
    jugar: elementos.adminBtnJugar,
  };

  function crearIdMazo() {
    return `mazo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function obtenerMazo(id) {
    return estadoJuego.mazosGuardados.find((mazo) => mazo.id === id) || null;
  }

  function guardarBiblioteca() {
    const guardado = guardarDatos({
      version: 1,
      mazos: estadoJuego.mazosGuardados,
      configuracion: estadoJuego.configuracionMazos,
    });
    const indicador = document.getElementById("estado-guardado");
    if (indicador) {
      indicador.textContent = guardado
        ? "✓ CAMBIOS GUARDADOS EN ESTE DISPOSITIVO"
        : "⚠ NO SE PUDO GUARDAR · REVISÁ EL ESPACIO DEL NAVEGADOR";
      indicador.classList.toggle("estado-guardado-error", !guardado);
      indicador.setAttribute("role", guardado ? "status" : "alert");
    }
    return guardado;
  }

  function normalizarBiblioteca() {
    const datos = cargarDatosGuardados();
    if (datos?.mazos?.length) {
      const idsUsados = new Set();
      estadoJuego.mazosGuardados = datos.mazos
        .filter((m) => m && Array.isArray(m.cartas))
        .map((m) => {
          let id = typeof m.id === "string" && m.id.trim() ? m.id.trim() : crearIdMazo();
          if (idsUsados.has(id)) id = crearIdMazo();
          idsUsados.add(id);
          const cartas = m.cartas
            .filter((c) => c && typeof c === "object" && !Array.isArray(c) && c.ID !== undefined && c.ID !== null)
            .map((c) => ({ ...c, ID: c.ID, NOMBRE: String(c.NOMBRE || `CARTA ${c.ID}`) }));
          return {
            id,
            nombre: String(m.nombre || "Mazo sin nombre").trim().slice(0, 36) || "Mazo sin nombre",
            cartas,
          };
        });
      estadoJuego.configuracionMazos = {
        jugadorId: datos.configuracion?.jugadorId || estadoJuego.mazosGuardados[0]?.id || null,
        rivalPersonalizado: Boolean(datos.configuracion?.rivalPersonalizado),
        rivalId: datos.configuracion?.rivalId || null,
      };
    }
    if (!estadoJuego.mazosGuardados.length) {
      const id = crearIdMazo();
      estadoJuego.mazosGuardados = [{ id, nombre: "Mi primer mazo", cartas: [] }];
      estadoJuego.configuracionMazos = { jugadorId: id, rivalPersonalizado: false, rivalId: id };
    }
    if (!obtenerMazo(estadoJuego.configuracionMazos.jugadorId)) {
      estadoJuego.configuracionMazos.jugadorId = estadoJuego.mazosGuardados[0].id;
    }
    if (!obtenerMazo(estadoJuego.configuracionMazos.rivalId)) {
      estadoJuego.configuracionMazos.rivalId = estadoJuego.configuracionMazos.jugadorId;
      estadoJuego.configuracionMazos.rivalPersonalizado = false;
    }
    estadoJuego.mazoActivoId = estadoJuego.configuracionMazos.jugadorId;
    estadoJuego.mazoConstruido = obtenerMazo(estadoJuego.mazoActivoId).cartas;
    guardarBiblioteca();
  }

  // La biblioteca debe estar lista antes de registrar eventos o renderizar el menú.
  normalizarBiblioteca();

  function guardarMazoActivo() {
    const mazo = obtenerMazo(estadoJuego.mazoActivoId);
    if (mazo) {
      mazo.cartas = estadoJuego.mazoConstruido;
      guardarBiblioteca();
      renderizarAdministrador();
    }
  }

  function cambiarMazoActivo(id) {
    const mazo = obtenerMazo(id);
    if (!mazo) return false;
    estadoJuego.mazoActivoId = id;
    estadoJuego.mazoConstruido = mazo.cartas;
    renderizarMazoConstruido();
    return true;
  }

  function renderizarAdministrador() {
    if (!admin.lista) return;
    admin.lista.innerHTML = "";
    estadoJuego.mazosGuardados.forEach((mazo) => {
      const fila = document.createElement("article");
      fila.className = "mazo-guardado-card";
      const info = document.createElement("div");
      info.className = "mazo-guardado-info";
      const nombre = document.createElement("strong");
      nombre.textContent = mazo.nombre;
      const detalle = document.createElement("small");
      detalle.textContent = `${mazo.cartas.length} CARTAS${mazo.id === estadoJuego.configuracionMazos.jugadorId ? " · TU MAZO" : ""}${estadoJuego.configuracionMazos.rivalPersonalizado && mazo.id === estadoJuego.configuracionMazos.rivalId ? " · MAZO RIVAL" : ""}`;
      info.append(nombre, detalle);
      const acciones = document.createElement("div");
      acciones.className = "mazo-guardado-acciones";
      const editar = document.createElement("button");
      editar.type = "button"; editar.className = "btn-secundario";
      editar.textContent = "EDITAR";
      editar.addEventListener("click", () => abrirEditor(mazo.id));
      const duplicar = document.createElement("button");
      duplicar.type = "button"; duplicar.className = "btn-secundario";
      duplicar.textContent = "DUPLICAR";
      duplicar.addEventListener("click", () => {
        const copia = { id: crearIdMazo(), nombre: `${mazo.nombre} (copia)`, cartas: mazo.cartas.map((c) => ({ ...c })) };
        estadoJuego.mazosGuardados.push(copia); guardarBiblioteca(); renderizarAdministrador();
        sonidos.menuAbrir?.();
      });
      const eliminar = document.createElement("button");
      eliminar.type = "button"; eliminar.className = "btn-secundario btn-eliminar-mazo";
      eliminar.textContent = "ELIMINAR";
      eliminar.disabled = estadoJuego.mazosGuardados.length <= 1;
      eliminar.addEventListener("click", () => {
        if (estadoJuego.mazosGuardados.length <= 1 || !window.confirm(`¿Eliminar "${mazo.nombre}"?`)) return;
        estadoJuego.mazosGuardados = estadoJuego.mazosGuardados.filter((m) => m.id !== mazo.id);
        if (estadoJuego.configuracionMazos.jugadorId === mazo.id) estadoJuego.configuracionMazos.jugadorId = estadoJuego.mazosGuardados[0].id;
        if (estadoJuego.configuracionMazos.rivalId === mazo.id) {
          estadoJuego.configuracionMazos.rivalId = estadoJuego.configuracionMazos.jugadorId;
          estadoJuego.configuracionMazos.rivalPersonalizado = false;
        }
        if (estadoJuego.mazoActivoId === mazo.id) cambiarMazoActivo(estadoJuego.configuracionMazos.jugadorId);
        guardarBiblioteca(); renderizarAdministrador(); renderizarSelectores(); actualizarProgreso();
      });
      acciones.append(editar, duplicar, eliminar);
      fila.append(info, acciones);
      admin.lista.appendChild(fila);
    });
    renderizarSelectores();
  }

  function renderizarSelectores() {
    [admin.selectJugador, admin.selectRival].forEach((select) => {
      if (!select) return;
      const actual = select === admin.selectJugador ? estadoJuego.configuracionMazos.jugadorId : estadoJuego.configuracionMazos.rivalId;
      select.innerHTML = "";
      estadoJuego.mazosGuardados.forEach((mazo) => {
        const option = document.createElement("option");
        option.value = mazo.id; option.textContent = `${mazo.nombre} · ${mazo.cartas.length} cartas`;
        select.appendChild(option);
      });
      select.value = actual;
    });
    if (admin.toggleRival) admin.toggleRival.checked = estadoJuego.configuracionMazos.rivalPersonalizado;
    if (admin.rivalSelector) admin.rivalSelector.classList.toggle("oculto", !estadoJuego.configuracionMazos.rivalPersonalizado);
  }

  function abrirEditor(id) {
    cambiarMazoActivo(id);
    admin.nombreEditor.value = obtenerMazo(id)?.nombre || "";
    admin.tituloEditor.textContent = `EDITANDO · ${obtenerMazo(id)?.nombre || "MAZO"}`;
    admin.vista?.classList.add("oculto");
    admin.editor?.classList.remove("oculto");
    admin.editor?.classList.add("editor-mazo-activo");
    actualizarProgreso();
    sonidos.menuAbrir?.();
  }

  function volverAlAdministrador() {
    guardarMazoActivo();
    admin.editor?.classList.add("oculto");
    admin.editor?.classList.remove("editor-mazo-activo");
    admin.vista?.classList.remove("oculto");
    renderizarAdministrador();
    sonidos.menuCerrar?.();
  }

  function crearNuevoMazo() {
    const numero = estadoJuego.mazosGuardados.length + 1;
    const mazo = { id: crearIdMazo(), nombre: `Nuevo mazo ${numero}`, cartas: [] };
    estadoJuego.mazosGuardados.push(mazo);
    guardarBiblioteca();
    abrirEditor(mazo.id);
    renderizarAdministrador();
  }

  admin.crear?.addEventListener("click", crearNuevoMazo);
  admin.volver?.addEventListener("click", volverAlAdministrador);
  admin.nombreEditor?.addEventListener("input", () => {
    const mazo = obtenerMazo(estadoJuego.mazoActivoId);
    if (!mazo) return;
    mazo.nombre = admin.nombreEditor.value.trim() || "Mazo sin nombre";
    admin.tituloEditor.textContent = `EDITANDO · ${mazo.nombre}`;
    guardarBiblioteca();
  });
  admin.selectJugador?.addEventListener("change", () => {
    estadoJuego.configuracionMazos.jugadorId = admin.selectJugador.value;
    if (!estadoJuego.configuracionMazos.rivalPersonalizado) {
      estadoJuego.configuracionMazos.rivalId = admin.selectJugador.value;
    }
    cambiarMazoActivo(admin.selectJugador.value);
    guardarBiblioteca(); actualizarProgreso(); renderizarAdministrador();
  });
  admin.toggleRival?.addEventListener("change", () => {
    estadoJuego.configuracionMazos.rivalPersonalizado = admin.toggleRival.checked;
    if (!admin.toggleRival.checked) estadoJuego.configuracionMazos.rivalId = estadoJuego.configuracionMazos.jugadorId;
    guardarBiblioteca(); renderizarSelectores(); renderizarAdministrador();
  });
  admin.selectRival?.addEventListener("change", () => {
    estadoJuego.configuracionMazos.rivalId = admin.selectRival.value;
    guardarBiblioteca(); renderizarAdministrador();
  });
  admin.jugar?.addEventListener("click", () => elementos.btnJugar?.click());

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

  let catalogoDeRespaldo = false;

  async function cargarCatalogo() {
    catalogoDeRespaldo = false;
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
      catalogoDeRespaldo = true;
      estadoJuego.catalogo = CARTAS_RESPALDO.map((c) => ({ ...c }));
    }
    await precargarImagenesCartas(estadoJuego.catalogo);
    inicializarFiltrosCatalogo();
    renderizarCatalogoConstructor();
    renderizarMazoConstruido();
    renderizarAdministrador();
  }

  function tieneMazoValidoInterno() {
    const jugador = obtenerMazo(estadoJuego.configuracionMazos.jugadorId);
    const rival = obtenerMazo(estadoJuego.configuracionMazos.rivalId);
    return (jugador?.cartas.length || 0) >= MINIMO_MAZO
      && (!estadoJuego.configuracionMazos.rivalPersonalizado || (rival?.cartas.length || 0) >= MINIMO_MAZO);
  }

  function actualizarProgreso() {
    const total = estadoJuego.mazoConstruido.length;
    const listo = tieneMazoValidoInterno();
    contador.textContent = total;
    barra.style.width = `${Math.min(100, total / MINIMO_MAZO * 100)}%`;
    const rival = obtenerMazo(estadoJuego.configuracionMazos.rivalId);
    const rivalInvalido = estadoJuego.configuracionMazos.rivalPersonalizado && (rival?.cartas.length || 0) < MINIMO_MAZO;
    estado.textContent = listo ? "✦ MAZOS COMPLETOS · LISTOS PARA EL COMBATE" : rivalInvalido ? `EL MAZO DEL RIVAL NECESITA ${Math.max(0, MINIMO_MAZO - (rival?.cartas.length || 0))} CARTAS MÁS` : `AGREGÁ ${Math.max(0, MINIMO_MAZO - total)} CARTAS MÁS PARA DESBLOQUEAR EL COMBATE`;
    estado.classList.toggle("mazo-listo", listo);
    btnJugar.disabled = !listo;
    if (admin.jugar) admin.jugar.disabled = !listo;
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
    guardarBiblioteca();
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
    guardarBiblioteca();
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

  function tiposNormalizados(carta) {
    const raw = Array.isArray(carta?.TIPO) ? carta.TIPO : [carta?.TIPO ?? ""];
    const tipos = new Set();
    raw.forEach((valor) => {
      const texto = String(valor).trim().toUpperCase();
      if (!texto) return;
      if (texto === "ESFERAS DEL DRAGON" || texto === "ESFERA DEL DRAGON") {
        tipos.add("ESFERAS DEL DRAGON");
        return;
      }
      texto.split(/[\\s,/+]+/).filter(Boolean).forEach((parte) => {
        if (parte === "INSTANTANEAS") tipos.add("INSTANTANEA");
        else if (parte === "MODIFICADORAS") tipos.add("MODIFICADORA");
        else if (parte === "INSTANTANEA") tipos.add("INSTANTANEA");
        else if (parte === "MODIFICADORA") tipos.add("MODIFICADORA");
        else tipos.add(parte);
      });
    });
    return [...tipos];
  }

  function valorNumerico(carta, campo) {
    const valor = Number(carta?.[campo]);
    return carta?.[campo] !== undefined && carta?.[campo] !== null && carta?.[campo] !== "" && Number.isFinite(valor)
      ? valor
      : null;
  }

  function inicializarFiltrosCatalogo() {
    if (filtrosCatalogo.esfera) {
      const esferas = [...new Set(estadoJuego.catalogo.map((c) => String(c.ESFERA ?? "")).filter(Boolean))]
        .sort((a, b) => numeroOrden(a) - numeroOrden(b));
      filtrosCatalogo.esfera.innerHTML = '<option value="">TODAS</option>';
      esferas.forEach((esfera) => {
        const option = document.createElement("option");
        option.value = esfera;
        option.textContent = `ESFERA ${esfera}`;
        filtrosCatalogo.esfera.appendChild(option);
      });
    }
    if (filtrosCatalogo.tipo) {
      const tipos = [...new Set(estadoJuego.catalogo.flatMap(tiposNormalizados))]
        .sort((a, b) => a.localeCompare(b, "es"));
      filtrosCatalogo.tipo.innerHTML = '<option value="">TODOS</option>';
      tipos.forEach((tipo) => {
        const option = document.createElement("option");
        option.value = tipo;
        option.textContent = tipo;
        filtrosCatalogo.tipo.appendChild(option);
      });
    }
  }

  function obtenerCartasFiltradas() {
    const esfera = filtrosCatalogo.esfera?.value || "";
    const tipo = filtrosCatalogo.tipo?.value || "";
    const numero = filtrosCatalogo.numero?.value.trim() || "";
    const campo = filtrosCatalogo.campo?.value || "catalogo";
    const direccion = filtrosCatalogo.direccion?.value === "desc" ? -1 : 1;

    const cartas = estadoJuego.catalogo.filter((carta) => {
      if (esfera && String(carta.ESFERA ?? "") !== esfera) return false;
      if (tipo && !tiposNormalizados(carta).includes(tipo)) return false;
      if (numero && !String(carta.ID ?? "").includes(numero)) return false;
      return true;
    });

    if (campo !== "catalogo") {
      cartas.sort((a, b) => {
        const av = valorNumerico(a, campo);
        const bv = valorNumerico(b, campo);
        // Las cartas sin valor de ataque/defensa quedan siempre al final.
        if (av === null && bv === null) return numeroOrden(a.ID) - numeroOrden(b.ID);
        if (av === null) return 1;
        if (bv === null) return -1;
        return (av - bv) * direccion || (numeroOrden(a.ID) - numeroOrden(b.ID)) * direccion;
      });
    } else {
      cartas.sort((a, b) => (numeroOrden(a.ID) - numeroOrden(b.ID)) * direccion);
    }
    return cartas;
  }

  function conectarFiltrosCatalogo() {
    [filtrosCatalogo.esfera, filtrosCatalogo.tipo, filtrosCatalogo.numero,
      filtrosCatalogo.campo, filtrosCatalogo.direccion].filter(Boolean)
      .forEach((control) => control.addEventListener(control.tagName === "INPUT" ? "input" : "change", renderizarCatalogoConstructor));
    filtrosCatalogo.limpiar?.addEventListener("click", () => {
      if (filtrosCatalogo.esfera) filtrosCatalogo.esfera.value = "";
      if (filtrosCatalogo.tipo) filtrosCatalogo.tipo.value = "";
      if (filtrosCatalogo.numero) filtrosCatalogo.numero.value = "";
      if (filtrosCatalogo.campo) filtrosCatalogo.campo.value = "catalogo";
      if (filtrosCatalogo.direccion) filtrosCatalogo.direccion.value = "asc";
      renderizarCatalogoConstructor();
    });
  }

  conectarFiltrosCatalogo();

  function renderizarCatalogoConstructor() {
    catalogoGrid.innerHTML = "";
    if (catalogoDeRespaldo) {
      const aviso = document.createElement("p");
      aviso.className = "catalogo-aviso";
      aviso.setAttribute("role", "status");
      aviso.textContent = "CATÁLOGO DE RESPALDO: no se pudo cargar data/cartas_exp1.json. Se muestran únicamente las cartas de prueba incluidas en el código.";
      catalogoGrid.appendChild(aviso);
    }
    const cartasVisibles = obtenerCartasFiltradas();
    if (filtrosCatalogo.resultados) {
      filtrosCatalogo.resultados.textContent = `${cartasVisibles.length} DE ${estadoJuego.catalogo.length} CARTAS`;
    }
    if (!cartasVisibles.length) {
      const sinResultados = document.createElement("p");
      sinResultados.className = "catalogo-sin-resultados";
      sinResultados.textContent = "NO HAY CARTAS QUE COINCIDAN CON LOS FILTROS.";
      catalogoGrid.appendChild(sinResultados);
    }
    cartasVisibles.forEach((carta) => {
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
    const configuracion = estadoJuego.configuracionMazos;
    const mazoJugador = obtenerMazo(configuracion.jugadorId) || obtenerMazo(estadoJuego.mazoActivoId);
    const mazoRival = configuracion.rivalPersonalizado
      ? obtenerMazo(configuracion.rivalId)
      : mazoJugador;
    const baseJugador = (mazoJugador?.cartas || []).map((c) => ({ ...c }));
    const baseRival = (mazoRival?.cartas || baseJugador).map((c) => ({ ...c }));
    estadoJuego.mazosPartida = { jugador: mezclar(baseJugador), rival: mezclar(baseRival) };
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
    tieneMazoValido: () => {
      const jugador = obtenerMazo(estadoJuego.configuracionMazos.jugadorId);
      const rival = obtenerMazo(estadoJuego.configuracionMazos.rivalId);
      const jugadorValido = (jugador?.cartas.length || 0) >= MINIMO_MAZO;
      const rivalValido = !estadoJuego.configuracionMazos.rivalPersonalizado || (rival?.cartas.length || 0) >= MINIMO_MAZO;
      return jugadorValido && rivalValido;
    },
    renderizarAdministrador,
    abrirEditor,
    volverAlAdministrador,
  };
}
