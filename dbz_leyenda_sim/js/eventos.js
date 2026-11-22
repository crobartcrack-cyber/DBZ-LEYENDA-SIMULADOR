import { estadoJuego } from "./estado.js";

export function configurarEventos(elementos, sistemas) {
  const { pantallaInicio, pantallaJuego, btnJugar } = elementos;
  const { prepararMazosDePartida, tieneMazoValido, iniciarPartida, sonidos = {} } = sistemas;

  let iniciandoPartida = false;
  btnJugar.addEventListener("click", async () => {
    if (iniciandoPartida || !tieneMazoValido()) {
      sonidos.error?.();
      return;
    }
    iniciandoPartida = true;
    btnJugar.disabled = true;
    sonidos.desbloquear?.();
    sonidos.inicio?.();
    try {
      prepararMazosDePartida();
      pantallaInicio.classList.add("oculto");
      pantallaJuego.classList.remove("oculto");
      await iniciarPartida();
    } catch (error) {
      console.error("No se pudo iniciar la partida:", error);
      pantallaInicio.classList.remove("oculto");
      pantallaJuego.classList.add("oculto");
    } finally {
      iniciandoPartida = false;
      btnJugar.disabled = !tieneMazoValido();
    }
  });

}
