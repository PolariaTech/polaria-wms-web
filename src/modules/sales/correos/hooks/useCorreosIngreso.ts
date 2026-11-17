"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FILTROS_CORREOS_VACIOS,
  TAMANO_PAGINA_CORREOS,
  type CorreoFila,
  type FiltrosCorreos,
  type ModoCorreos,
} from "../types/correos.types";
import { useBloquesCorreos } from "./useBloquesCorreos";
import { useEstadoListaEnUrl } from "./useEstadoListaEnUrl";
import { useIngresoCorreo } from "./useIngresoCorreo";

const RETARDO_FILTROS_MS = 350;

/** Los filtros que se escriben, y los que se aplican tras un breve retardo para no pedir por tecla. */
export function useFiltrosCorreos(inicial: FiltrosCorreos = FILTROS_CORREOS_VACIOS) {
  const [filtros, setFiltros] = useState<FiltrosCorreos>(inicial);
  const [aplicados, setAplicados] = useState<FiltrosCorreos>(inicial);
  const aplicadosRef = useRef<FiltrosCorreos>(inicial);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      // Solo si de verdad cambiaron: así un clic en «siguiente» justo al abrir no se pierde.
      if (aplicadosRef.current === filtros) return;
      aplicadosRef.current = filtros;
      setAplicados(filtros);
    }, RETARDO_FILTROS_MS);
    return () => clearTimeout(temporizador);
  }, [filtros]);

  const setFiltro = useCallback((campo: keyof FiltrosCorreos, valor: string) => {
    setFiltros((previo) => ({ ...previo, [campo]: valor }));
  }, []);
  const limpiarFiltros = useCallback(() => setFiltros(FILTROS_CORREOS_VACIOS), []);

  return {
    filtros,
    aplicados,
    setFiltro,
    limpiarFiltros,
    hayFiltros: Object.values(filtros).some((valor) => valor !== ""),
  };
}

/**
 * Estado de una pantalla de correos (REQ-104): filtros, la página que se ve (sobre bloques que
 * se piden al servidor) y el ingreso manual de un correo como OV con el seguimiento de su avance.
 */
export function useCorreosIngreso(modo: ModoCorreos) {
  const url = useEstadoListaEnUrl();
  const { guardar } = url;
  const filtrado = useFiltrosCorreos(url.inicial.filtros);
  const bloques = useBloquesCorreos(modo, filtrado.aplicados, url.inicial.pagina);
  const { locales, ingresar, sondear } = useIngresoCorreo();
  const recargar = bloques.recargar;
  const recargados = useRef(new Set<string>());

  useEffect(() => {
    guardar({ filtros: filtrado.aplicados, pagina: bloques.pagina });
  }, [filtrado.aplicados, bloques.pagina, guardar]);

  // REQ-314: en descartados, un correo recién ingresado sale de la lista sin pulsar Actualizar; el aviso de éxito ya dice la OV.
  useEffect(() => {
    if (modo !== "descartados") return;
    const nuevos = Object.keys(locales).filter(
      (id) => locales[id]?.estado === "ingresado" && !recargados.current.has(id),
    );
    if (nuevos.length === 0) return;
    for (const id of nuevos) recargados.current.add(id);
    recargar();
  }, [locales, modo, recargar]);

  const filas = useMemo<CorreoFila[]>(
    () =>
      bloques.filas.map((fila) => {
        const local = locales[fila.messageId];
        return local ? { ...fila, ingreso: local } : fila;
      }),
    [bloques.filas, locales],
  );

  // Una fila que ya venía en `procesando` (otra pestaña, otro clic) también se sigue.
  useEffect(() => {
    for (const fila of filas) {
      if (fila.ingreso?.estado === "procesando") sondear(fila.messageId);
    }
  }, [filas, sondear]);

  return {
    filtros: filtrado.filtros,
    setFiltro: filtrado.setFiltro,
    limpiarFiltros: filtrado.limpiarFiltros,
    hayFiltros: filtrado.hayFiltros,
    filas,
    idsDelBloque: bloques.idsDelBloque,
    total: bloques.total,
    pagina: bloques.pagina,
    setPagina: bloques.setPagina,
    tamano: TAMANO_PAGINA_CORREOS,
    cargando: bloques.cargando,
    error: bloques.error,
    recargar: bloques.recargar,
    ingresar,
  };
}
