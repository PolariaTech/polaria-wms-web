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
  TAMANO_BLOQUE_CORREOS,
  TAMANO_PAGINA_CORREOS,
  type CorreoFila,
  type CorreosLista,
  type FiltrosCorreos,
  type IngresoCorreo,
  type ModoCorreos,
} from "../types/correos.types";

const RETARDO_FILTROS_MS = 350;
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
  const [cache, setCache] = useState<CacheBloques>({ clave: "", bloques: {} });
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  /** Lo que el operador acaba de hacer; manda sobre lo que trajo la lista. */
  const [locales, setLocales] = useState<Record<string, IngresoCorreo>>({});
  const sondeos = useRef(new Map<string, AbortController>());
  const aplicadosRef = useRef<FiltrosCorreos>(FILTROS_CORREOS_VACIOS);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      // Solo si de verdad cambiaron: así un clic en «siguiente» justo al abrir no se pierde.
      if (aplicadosRef.current === filtros) return;
      aplicadosRef.current = filtros;
      setAplicados(filtros);
      setPagina(1);
    }, RETARDO_FILTROS_MS);
    return () => clearTimeout(temporizador);
  }, [filtros]);

  const claveConsulta = useMemo(
    () => JSON.stringify([modo, aplicados, recarga]),
    [modo, aplicados, recarga],
  );
  const bloques = cache.clave === claveConsulta ? cache.bloques : SIN_BLOQUES;
  const bloqueActual = Math.floor((pagina - 1) / PAGINAS_POR_BLOQUE) + 1;
  const desplazamiento =
    ((pagina - 1) % PAGINAS_POR_BLOQUE) * TAMANO_PAGINA_CORREOS;
  const actual = bloques[bloqueActual];
  const tieneActual = actual !== undefined;
  const total = actual?.total ?? Object.values(bloques)[0]?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANO_PAGINA_CORREOS));

  const traerBloque = useCallback(
    (bloque: number, signal: AbortSignal) =>
      listarCorreos(
        {
          modo,
          pagina: bloque,
          tamano: TAMANO_BLOQUE_CORREOS,
          filtros: aplicados,
        },
        signal,
      ).then((lista) => {
        setCache((previo) => ({
          clave: claveConsulta,
          bloques:
            previo.clave === claveConsulta
              ? { ...previo.bloques, [bloque]: lista }
              : { [bloque]: lista },
        }));
      }),
    [modo, aplicados, claveConsulta],
  );

  // El bloque de la página que se está viendo.
  useEffect(() => {
    if (tieneActual) return;
    const control = new AbortController();
    setError(null);
    traerBloque(bloqueActual, control.signal).catch((causa: unknown) => {
      if (control.signal.aborted) return;
      setError(mensajeDe(causa));
    });
    return () => control.abort();
  }, [tieneActual, bloqueActual, traerBloque]);

  // Al acercarse al final del bloque se trae el siguiente, en silencio, para que el
  // cambio de bloque tampoco espere al servidor.
  const siguienteBloque = bloqueActual + 1;
  const hayOtroBloque = bloqueActual * TAMANO_BLOQUE_CORREOS < total;
  const cercaDelFinal =
    (pagina - 1) % PAGINAS_POR_BLOQUE >= PAGINAS_POR_BLOQUE - PAGINAS_DE_ANTICIPO;
  const tieneSiguiente = bloques[siguienteBloque] !== undefined;
  useEffect(() => {
    if (!tieneActual || !hayOtroBloque || !cercaDelFinal || tieneSiguiente) return;
    const control = new AbortController();
    traerBloque(siguienteBloque, control.signal).catch(() => undefined);
    return () => control.abort();
  }, [
    tieneActual,
    hayOtroBloque,
    cercaDelFinal,
    tieneSiguiente,
    siguienteBloque,
    traerBloque,
  ]);

  // Si al actualizar hay menos correos que antes, no se queda en una página que ya no existe.
  useEffect(() => {
    if (tieneActual && pagina > totalPaginas) setPagina(totalPaginas);
  }, [tieneActual, pagina, totalPaginas]);

  const cargando = !tieneActual && error === null;

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
      (actual?.filas ?? [])
        .slice(desplazamiento, desplazamiento + TAMANO_PAGINA_CORREOS)
        .map((fila) => {
          const local = locales[fila.messageId];
          return local ? { ...fila, ingreso: local } : fila;
        }),
    [actual, desplazamiento, locales],
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
    total,
    pagina,
    setPagina,
    tamano: TAMANO_PAGINA_CORREOS,
    cargando,
    error,
    recargar,
    ingresar,
  };
}
