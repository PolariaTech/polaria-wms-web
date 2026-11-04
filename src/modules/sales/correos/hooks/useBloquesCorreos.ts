"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listarCorreos } from "../services/correos.client";
import {
  TAMANO_BLOQUE_CORREOS,
  TAMANO_PAGINA_CORREOS,
  type CorreosLista,
  type FiltrosCorreos,
  type ModoCorreos,
} from "../types/correos.types";
import { mensajeDeError } from "../utils/correos-formato";

const PAGINAS_POR_BLOQUE = Math.floor(
  TAMANO_BLOQUE_CORREOS / TAMANO_PAGINA_CORREOS,
);
/** Cuántas páginas antes del final del bloque se empieza a traer el siguiente. */
const PAGINAS_DE_ANTICIPO = 3;
const SIN_BLOQUES: Record<number, CorreosLista> = {};

interface CacheBloques {
  /** Identifica la consulta (modo, filtros, recarga): otra consulta descarta lo guardado. */
  clave: string;
  bloques: Record<number, CorreosLista>;
}

/** En qué bloque descargado está una página, y en qué lugar dentro de él. */
export function posicionDePagina(pagina: number) {
  const indice = pagina - 1;
  return {
    bloque: Math.floor(indice / PAGINAS_POR_BLOQUE) + 1,
    paginaEnBloque: indice % PAGINAS_POR_BLOQUE,
    desplazamiento: (indice % PAGINAS_POR_BLOQUE) * TAMANO_PAGINA_CORREOS,
  };
}

/** La página elegida; vuelve a la primera cuando cambia la consulta (otros filtros, otro modo). */
function usePaginaElegida(claveFiltros: string) {
  const [eleccion, setEleccion] = useState({ clave: claveFiltros, pagina: 1 });
  const pagina = eleccion.clave === claveFiltros ? eleccion.pagina : 1;
  const setPagina = useCallback(
    (nueva: number) => setEleccion({ clave: claveFiltros, pagina: nueva }),
    [claveFiltros],
  );
  return { pagina, setPagina };
}

function useCacheDeBloques(
  modo: ModoCorreos,
  aplicados: FiltrosCorreos,
  recarga: number,
) {
  const [cache, setCache] = useState<CacheBloques>({ clave: "", bloques: {} });
  const clave = useMemo(
    () => JSON.stringify([modo, aplicados, recarga]),
    [modo, aplicados, recarga],
  );
  const bloques = cache.clave === clave ? cache.bloques : SIN_BLOQUES;

  const traerBloque = useCallback(
    (bloque: number, signal: AbortSignal) =>
      listarCorreos(
        { modo, pagina: bloque, tamano: TAMANO_BLOQUE_CORREOS, filtros: aplicados },
        signal,
      ).then((lista) => {
        setCache((previo) => ({
          clave,
          bloques:
            previo.clave === clave
              ? { ...previo.bloques, [bloque]: lista }
              : { [bloque]: lista },
        }));
      }),
    [modo, aplicados, clave],
  );
  return { bloques, traerBloque };
}

type TraerBloque = (bloque: number, signal: AbortSignal) => Promise<void>;

/** Al acercarse al final del bloque trae el siguiente, en silencio, para que cruzarlo no espere. */
function useAdelantoDelSiguiente(opciones: {
  listoElActual: boolean;
  hayOtroBloque: boolean;
  cercaDelFinal: boolean;
  yaTieneSiguiente: boolean;
  siguiente: number;
  traerBloque: TraerBloque;
}) {
  const { listoElActual, hayOtroBloque, cercaDelFinal, yaTieneSiguiente } = opciones;
  const { siguiente, traerBloque } = opciones;
  useEffect(() => {
    if (!listoElActual || !hayOtroBloque || !cercaDelFinal || yaTieneSiguiente) return;
    const control = new AbortController();
    traerBloque(siguiente, control.signal).catch(() => undefined);
    return () => control.abort();
  }, [listoElActual, hayOtroBloque, cercaDelFinal, yaTieneSiguiente, siguiente, traerBloque]);
}

/**
 * Los correos de la página que se ve, sacados de bloques de 50 que se piden al servidor: cada
 * clic en «siguiente» no hace un viaje nuevo. Cambiar de filtros, de modo o actualizar los descarta.
 */
export function useBloquesCorreos(modo: ModoCorreos, aplicados: FiltrosCorreos) {
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { pagina, setPagina } = usePaginaElegida(JSON.stringify([modo, aplicados]));
  const { bloques, traerBloque } = useCacheDeBloques(modo, aplicados, recarga);

  const { bloque, paginaEnBloque, desplazamiento } = posicionDePagina(pagina);
  const actual = bloques[bloque];
  const listoElActual = actual !== undefined;
  const total = actual?.total ?? Object.values(bloques)[0]?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANO_PAGINA_CORREOS));

  useEffect(() => {
    if (listoElActual) return;
    const control = new AbortController();
    setError(null);
    traerBloque(bloque, control.signal).catch((causa: unknown) => {
      if (!control.signal.aborted) setError(mensajeDeError(causa));
    });
    return () => control.abort();
  }, [listoElActual, bloque, traerBloque]);

  useAdelantoDelSiguiente({
    listoElActual,
    hayOtroBloque: bloque * TAMANO_BLOQUE_CORREOS < total,
    cercaDelFinal: paginaEnBloque >= PAGINAS_POR_BLOQUE - PAGINAS_DE_ANTICIPO,
    yaTieneSiguiente: bloques[bloque + 1] !== undefined,
    siguiente: bloque + 1,
    traerBloque,
  });

  // Si al actualizar hay menos correos que antes, no se queda en una página que ya no existe.
  useEffect(() => {
    if (listoElActual && pagina > totalPaginas) setPagina(totalPaginas);
  }, [listoElActual, pagina, totalPaginas, setPagina]);

  const filas = useMemo(
    () =>
      (actual?.filas ?? []).slice(desplazamiento, desplazamiento + TAMANO_PAGINA_CORREOS),
    [actual, desplazamiento],
  );
  const recargar = useCallback(() => setRecarga((previo) => previo + 1), []);

  return {
    filas,
    total,
    pagina,
    setPagina,
    cargando: !listoElActual && error === null,
    error,
    recargar,
  };
}
