
import { estadoJuego } from "./estado.js";

export function crearSistemaDescarte(
  elementos,
  { renderizarMano, sonidos = {} }
) {
  const btnDescartar = elementos.btnDescartar;

  function actualizarBotonDescartar() {
    const haySeleccion =
      estadoJuego.seleccionMano.instanciaId &&
      estadoJuego.seleccionMano.lado;

    btnDescartar.classList.toggle(
      "oculto",
      !haySeleccion
    );
  }

  function descartarCartaSeleccionada() {
    const { lado, instanciaId } = estadoJuego.seleccionMano;

    if (!lado || !instanciaId) return;

    const manoLado = estadoJuego.manos[lado];

    const idx = manoLado.findIndex(
      (item) => item.instanciaId === instanciaId
    );

    if (idx !== -1) {
      const [descartada] = manoLado.splice(idx, 1);

      estadoJuego.descarte[lado].push(descartada);
      sonidos.descartar?.();
    }

    estadoJuego.seleccionMano = {
      lado: null,
      instanciaId: null,
    };

    actualizarBotonDescartar();
    renderizarMano(lado);
  }

  return {
    actualizarBotonDescartar,
    descartarCartaSeleccionada,
  };
}
