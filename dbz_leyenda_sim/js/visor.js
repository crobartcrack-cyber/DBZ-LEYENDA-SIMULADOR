import { crearImagenCarta } from "./imagenes.js";

export function crearSistemaVisor(elementos, sonidos = {}) {
  const { visorOverlay, visorMarco, pantallaJuego } = elementos;

  function abrirVisorCarta(carta) {
    if (!carta || !visorOverlay || !visorMarco) return;
    visorMarco.innerHTML = "";

    const imgGrande = crearImagenCarta(
      carta.ID,
      carta.NOMBRE,
      "visor-carta-img",
      null,
      cerrarVisorCarta
    );
    imgGrande.draggable = false;
    visorMarco.appendChild(imgGrande);

    // El overlay vive directamente bajo body: puede mostrarse desde el menú
    // o desde la partida sin depender del stacking context de ninguna pantalla.
    visorOverlay.classList.remove("oculto");
    pantallaJuego?.classList.add("visor-abierto");
    sonidos.inspeccionar?.();
  }

  function cerrarVisorCarta() {
    if (!visorOverlay || !visorMarco) return;
    const estabaAbierto = !visorOverlay.classList.contains("oculto");
    visorOverlay.classList.add("oculto");
    visorMarco.innerHTML = "";
    pantallaJuego?.classList.remove("visor-abierto");
    if (estabaAbierto) sonidos.menuCerrar?.();
  }

  visorOverlay?.addEventListener("click", (e) => {
    if (!e.target.closest("#visor-carta-marco")) cerrarVisorCarta();
  });

  // Escape cierra el visor tanto en escritorio como en dispositivos con teclado.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && visorOverlay && !visorOverlay.classList.contains("oculto")) {
      cerrarVisorCarta();
    }
  });

  return { abrirVisorCarta, cerrarVisorCarta };
}
