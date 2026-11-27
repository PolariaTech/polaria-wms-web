"use client";

import { useSyncExternalStore } from "react";
import type { PreciosSeparadosComprador } from "../utils/pedido/precio-cuando-falta-solicitud";

const vacio: PreciosSeparadosComprador = { ultimos: {}, equivalencia: {} };
let publicado: PreciosSeparadosComprador = vacio;
const oyentes = new Set<() => void>();

export function publicarPreciosSeparados(siguiente: PreciosSeparadosComprador) {
  publicado = siguiente;
  oyentes.forEach((avisar) => avisar());
}

export function leerPreciosSeparados(): PreciosSeparadosComprador {
  return publicado;
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => {
    oyentes.delete(avisar);
  };
}

export function usePreciosSeparados(): PreciosSeparadosComprador {
  return useSyncExternalStore(suscribir, leerPreciosSeparados, leerPreciosSeparados);
}
