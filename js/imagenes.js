// Caché compartida de imágenes: cada carta se descarga y decodifica una sola vez.
// Se conserva el objeto Image original en memoria durante toda la sesión.
const cacheImagenes = new Map();

export function obtenerRutaImagenCarta(id, extension) {
  return `./assets/cards/${encodeURIComponent(String(id))}.${extension}`;
}

function resolverImagenCarta(id) {
  const clave = String(id);
  if (cacheImagenes.has(clave)) return cacheImagenes.get(clave);

  const promesa = new Promise((resolve) => {
    const extensiones = ["png", "jpg"];
    let pendientes = extensiones.length;
    let encontrada = false;

    extensiones.forEach((extension) => {
      const prueba = new Image();
      prueba.decoding = "async";
      prueba.onload = async () => {
        if (encontrada) return;
        encontrada = true;
        try { if (prueba.decode) await prueba.decode(); } catch (_) { /* ya cargada */ }
        resolve(prueba);
      };
      prueba.onerror = () => {
        pendientes--;
        if (pendientes === 0 && !encontrada) resolve(null);
      };
      prueba.src = obtenerRutaImagenCarta(id, extension);
    });
  });

  cacheImagenes.set(clave, promesa);
  return promesa;
}

export async function precargarImagenesCartas(cartas = []) {
  await Promise.all(cartas.map((carta) => resolverImagenCarta(carta.ID)));
}

export function crearImagenCarta(id, nombre, claseImg = "carta-img", onCargada = null, onSinImagen = null) {
  const img = document.createElement("img");
  img.className = claseImg;
  img.alt = nombre ? `[${id}] ${nombre}` : `Carta ${id}`;
  img.loading = "eager";
  img.decoding = "async";
  img.draggable = false;
  img.setAttribute("draggable", "false");

  resolverImagenCarta(id).then((imagenCacheada) => {
    if (!imagenCacheada) {
      img.remove();
      if (typeof onSinImagen === "function") onSinImagen();
      return;
    }
    img.src = imagenCacheada.src;
    if (typeof onCargada === "function") {
      if (img.complete && img.naturalWidth) onCargada(img);
      else img.addEventListener("load", () => onCargada(img), { once: true });
    }
  });
  return img;
}
