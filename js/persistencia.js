const CLAVE = "dbz-leyenda:mazos:v1";

export function cargarDatosGuardados() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return null;
    const datos = JSON.parse(raw);
    if (!datos || !Array.isArray(datos.mazos)) return null;
    return datos;
  } catch (error) {
    console.warn("No se pudieron recuperar los mazos guardados:", error);
    return null;
  }
}

export function guardarDatos(datos) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
    return true;
  } catch (error) {
    console.warn("No se pudieron guardar los mazos. El almacenamiento puede estar lleno o deshabilitado:", error);
    return false;
  }
}
