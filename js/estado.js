
export const CARTAS_RESPALDO = [
  { ID: 9, NOMBRE: "SUPER VELOCIDAD" },
  { ID: 8, NOMBRE: "LA FURIA DE VEGETA" },
  { ID: 14, NOMBRE: "EL DUELO" },
  { ID: 88, NOMBRE: "KAIOH SHIN" },
];

export const estadoJuego = {
  energia: {
    jugador: 500,
    rival: 500,
  },

  catalogo: [],
  mazoConstruido: [],
  mazosPartida: { jugador: [], rival: [] },

  mazoObjetivo: "jugador",

  manos: {
    jugador: [],
    rival: [],
  },

  seleccionMano: {
    lado: null,
    instanciaId: null,
  },

  mesa: {
    jugador: {},
    rival: {},
  },

  descarte: {
    jugador: [],
    rival: [],
  },
};

let contadorInstancias = 1;

export function crearInstanciaCarta(carta) {
  return {
    instanciaId: `inst_${contadorInstancias++}`,
    carta: {
      ...carta,
    },
  };
}

export function reiniciarEstadoJuego() {
  estadoJuego.energia.jugador = 500;
  estadoJuego.mazosPartida = { jugador: [], rival: [] };
  estadoJuego.energia.rival = 500;

  estadoJuego.mazoObjetivo = "jugador";

  estadoJuego.manos.jugador = [];
  estadoJuego.manos.rival = [];

  estadoJuego.seleccionMano = {
    lado: null,
    instanciaId: null,
  };

  estadoJuego.mesa.jugador = {};
  estadoJuego.mesa.rival = {};

  estadoJuego.descarte.jugador = [];
  estadoJuego.descarte.rival = [];
}