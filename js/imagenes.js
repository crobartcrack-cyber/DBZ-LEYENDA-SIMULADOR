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
      // Mantiene una ficha visible y utilizable cuando el ZIP no trae el arte original.
      const idSeguro = String(id).replace(/[<>&"']/g, "");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 590"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#18233a"/><stop offset="1" stop-color="#402b16"/></linearGradient></defs><rect width="420" height="590" rx="18" fill="url(#g)"/><rect x="14" y="14" width="392" height="562" rx="12" fill="none" stroke="#e6a93c" stroke-width="4"/><text x="210" y="250" text-anchor="middle" fill="#f7d58b" font-family="Arial,sans-serif" font-size="25" font-weight="700">DBZ · LEYENDA</text><text x="210" y="300" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="21">CARTA ${idSeguro}</text><text x="210" y="350" text-anchor="middle" fill="#c6cbd5" font-family="Arial,sans-serif" font-size="14">ARTE ORIGINAL NO INCLUIDO</text></svg>`;
      img.classList.add("carta-img-sin-recurso");
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
