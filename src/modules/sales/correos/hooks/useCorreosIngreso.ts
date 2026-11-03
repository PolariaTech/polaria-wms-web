"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePolariaToast } from "@/components/shared/toast/PolariaToastProvider";
import {
  consultarIngreso,
  CorreosApiError,
  ingresarCorreo,
  listarCorreos,
} from "../services/correos.client";
import {
  FILTROS_CORREOS_VACIOS,
  TAMANO_PAGINA_CORREOS,
  type CorreoFila,
  type CorreosLista,
  type FiltrosCorreos,
  type IngresoCorreo,
  type ModoCorreos,
} from "../types/correos.types";

const RETARDO_FILTROS_MS = 350;
const SONDEO_CADA_MS = 3_000;
/** Pasado este tiempo se deja de sondear; la tabla actualizada dirá si al final quedó. */
const SONDEO_MAXIMO_MS = 5 * 60_000;

const ERRORES_QUE_CORTAN_EL_SONDEO: ReadonlySet<string> = new Set([
  "SESION",
  "SIN_PERMISO",
  "CUENTA_NO_HABILITADA",
]);

function mensajeDe(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Ocurrió un error inesperado. Intenta de nuevo.";
}

function esperar(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolver) => {
    if (signal.aborted) {
      resolver();
      return;
    }
    const alTerminar = () => {
      clearTimeout(temporizador);
      resolver();
    };
    const temporizador = setTimeout(() => {
      signal.removeEventListener("abort", alTerminar);
      resolver();
    }, ms);
    signal.addEventListener("abort", alTerminar, { once: true });
  });
}

const enProceso = (messageId: string): IngresoCorreo => ({
  messageId,
  estado: "procesando",
  idOrdenVenta: null,
  codigoOrdenVenta: null,
  error: null,
});

const conError = (messageId: string, error: string): IngresoCorreo => ({
  ...enProceso(messageId),
  estado: "error",
  error,
});

/**
 * Estado de una pantalla de correos (REQ-104): filtros con retardo, paginación del
 * servidor, ingreso manual de un correo como OV y sondeo de su avance.
 */
export function useCorreosIngreso(modo: ModoCorreos) {
  const { showToast } = usePolariaToast();
  const [filtros, setFiltros] = useState<FiltrosCorreos>(FILTROS_CORREOS_VACIOS);
  const [aplicados, setAplicados] =
    useState<FiltrosCorreos>(FILTROS_CORREOS_VACIOS);
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState<CorreosLista | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  /** Lo que el operador acaba de hacer; manda sobre lo que trajo la lista. */
  const [locales, setLocales] = useState<Record<string, IngresoCorreo>>({});
  const sondeos = useRef(new Map<string, AbortController>());

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setAplicados(filtros);
      setPagina(1);
    }, RETARDO_FILTROS_MS);
    return () => clearTimeout(temporizador);
  }, [filtros]);

  useEffect(() => {
    const control = new AbortController();
    setCargando(true);
    setError(null);
    listarCorreos(
      { modo, pagina, tamano: TAMANO_PAGINA_CORREOS, filtros: aplicados },
      control.signal,
    )
      .then((resultado) => {
        setLista(resultado);
        setCargando(false);
      })
      .catch((causa: unknown) => {
        if (control.signal.aborted) return;
        setError(mensajeDe(causa));
        setCargando(false);
      });
    return () => control.abort();
  }, [modo, pagina, aplicados, recarga]);

  const fijar = useCallback((ingreso: IngresoCorreo) => {
    setLocales((previo) => ({ ...previo, [ingreso.messageId]: ingreso }));
  }, []);

  const avisar = useCallback(
    (ingreso: IngresoCorreo) => {
      if (ingreso.estado === "ingresado") {
        showToast({
          variant: "success",
          title: "Pedido ingresado",
          content: ingreso.codigoOrdenVenta
            ? `Quedó registrado como ${ingreso.codigoOrdenVenta}.`
            : "Quedó registrado como orden de venta.",
        });
      } else if (ingreso.estado === "error") {
        showToast({
          variant: "error",
          title: "No se pudo ingresar el pedido",
          content: ingreso.error ?? "Intenta de nuevo.",
          durationMs: 6000,
        });
      }
    },
    [showToast],
  );

  const sondear = useCallback(
    (messageId: string) => {
      if (sondeos.current.has(messageId)) return;
      const control = new AbortController();
      sondeos.current.set(messageId, control);
      const inicio = Date.now();

      const vuelta = async () => {
        try {
          while (!control.signal.aborted) {
            await esperar(SONDEO_CADA_MS, control.signal);
            if (control.signal.aborted) return;
            try {
              const ingreso = await consultarIngreso(messageId, control.signal);
              if (ingreso.estado !== "procesando") {
                fijar(ingreso);
                avisar(ingreso);
                return;
              }
            } catch (causa) {
              if (control.signal.aborted) return;
              if (
                causa instanceof CorreosApiError &&
                ERRORES_QUE_CORTAN_EL_SONDEO.has(causa.codigo)
              ) {
                const ingreso = conError(messageId, causa.message);
                fijar(ingreso);
                avisar(ingreso);
                return;
              }
              // Un fallo de red suelto no corta el sondeo: se reintenta en la siguiente vuelta.
            }
            if (Date.now() - inicio > SONDEO_MAXIMO_MS) {
              fijar(
                conError(
                  messageId,
                  "Tardó más de lo esperado. Actualiza la tabla para ver si ya quedó ingresado.",
                ),
              );
              return;
            }
          }
        } finally {
          sondeos.current.delete(messageId);
        }
      };
      void vuelta();
    },
    [avisar, fijar],
  );

  useEffect(() => {
    const activos = sondeos.current;
    return () => {
      activos.forEach((control) => control.abort());
      activos.clear();
    };
  }, []);

  const filas = useMemo<CorreoFila[]>(
    () =>
      (lista?.filas ?? []).map((fila) => {
        const local = locales[fila.messageId];
        return local ? { ...fila, ingreso: local } : fila;
      }),
    [lista, locales],
  );

  // Una fila que ya venía en `procesando` (otra pestaña, otro clic) también se sigue.
  useEffect(() => {
    for (const fila of filas) {
      if (fila.ingreso?.estado === "procesando") sondear(fila.messageId);
    }
  }, [filas, sondear]);

  const ingresar = useCallback(
    async (messageId: string) => {
      fijar(enProceso(messageId));
      try {
        const ingreso = await ingresarCorreo(messageId);
        fijar(ingreso);
        if (ingreso.estado === "procesando") sondear(messageId);
        else avisar(ingreso);
      } catch (causa) {
        if (causa instanceof CorreosApiError && causa.codigo === "YA_INGRESADO") {
          try {
            fijar(await consultarIngreso(messageId));
            showToast({ variant: "info", content: causa.message });
            return;
          } catch {
            // Sin poder leer la OV, se cae al aviso de error de abajo.
          }
        }
        const ingreso = conError(messageId, mensajeDe(causa));
        fijar(ingreso);
        avisar(ingreso);
      }
    },
    [avisar, fijar, showToast, sondear],
  );

  const setFiltro = useCallback(
    (campo: keyof FiltrosCorreos, valor: string) => {
      setFiltros((previo) => ({ ...previo, [campo]: valor }));
    },
    [],
  );

  const limpiarFiltros = useCallback(() => {
    setFiltros(FILTROS_CORREOS_VACIOS);
  }, []);

  const recargar = useCallback(() => setRecarga((n) => n + 1), []);

  return {
    filtros,
    setFiltro,
    limpiarFiltros,
    hayFiltros: Object.values(filtros).some((valor) => valor !== ""),
    filas,
    total: lista?.total ?? 0,
    pagina,
    setPagina,
    tamano: TAMANO_PAGINA_CORREOS,
    cargando,
    error,
    recargar,
    ingresar,
  };
}
