import { CorreosApiError, listarCorreos } from "../services/correos.client";
import {
  FILTROS_CORREOS_VACIOS,
  TAMANO_BLOQUE_CORREOS,
  type CorreoFila,
  type IngresoCorreo,
} from "../types/correos.types";
import { mensajeDeError } from "./correos-formato";
import {
  esperarResultadoIngreso,
  pausaEntreReintentos,
} from "./esperar-resultado-ingreso";

export interface ProgresoLote {
  hechos: number;
  total: number;
  ok: number;
  asuntoActual: string;
}

export interface ResultadoLote {
  ok: number;
  pendientes: CorreoFila[];
  error: string | null;
}

interface CallbacksLote {
  signal: AbortSignal;
  onProgreso: (progreso: ProgresoLote) => void;
  onActivo: (messageId: string) => void;
  onMarcarFila: (messageId: string, fila: CorreoFila) => void;
  onQuitarFila: (messageId: string) => void;
}

export async function cargarReintentables(
  signal: AbortSignal,
): Promise<CorreoFila[]> {
  const acumuladas: CorreoFila[] = [];
  let pagina = 1;
  let total = Number.POSITIVE_INFINITY;
  while (acumuladas.length < total) {
    const bloque = await listarCorreos(
      {
        modo: "todos",
        pagina,
        tamano: TAMANO_BLOQUE_CORREOS,
        filtros: FILTROS_CORREOS_VACIOS,
        estadoIngreso: "reintentar",
      },
      signal,
    );
    total = bloque.total;
    acumuladas.push(...bloque.filas);
    if (bloque.filas.length === 0) break;
    pagina += 1;
  }
  return acumuladas;
}

export function conErrorLocal(fila: CorreoFila, error: string): CorreoFila {
  const ingreso: IngresoCorreo = {
    messageId: fila.messageId,
    estado: "error",
    idOrdenVenta: fila.ingreso?.idOrdenVenta ?? null,
    codigoOrdenVenta: fila.ingreso?.codigoOrdenVenta ?? null,
    error,
  };
  return { ...fila, ingreso };
}

export function enProcesoLocal(fila: CorreoFila): CorreoFila {
  return {
    ...fila,
    ingreso: {
      messageId: fila.messageId,
      estado: "procesando",
      idOrdenVenta: fila.ingreso?.idOrdenVenta ?? null,
      codigoOrdenVenta: fila.ingreso?.codigoOrdenVenta ?? null,
      error: null,
    },
  };
}

export function textoError(causa: unknown): string {
  if (causa instanceof CorreosApiError) return causa.message;
  return mensajeDeError(causa);
}

const ERRORES_QUE_CORTAN_LOTE: ReadonlySet<string> = new Set([
  "SESION",
  "SIN_PERMISO",
  "CUENTA_NO_HABILITADA",
  "LIMITE_SOLICITUDES",
]);

export function esErrorYaIngresado(causa: unknown): boolean {
  return causa instanceof CorreosApiError && causa.codigo === "YA_INGRESADO";
}

export function esErrorQueCortaLote(causa: unknown): boolean {
  return (
    causa instanceof CorreosApiError && ERRORES_QUE_CORTAN_LOTE.has(causa.codigo)
  );
}

export function esAbortado(causa: unknown): boolean {
  return causa instanceof DOMException && causa.name === "AbortError";
}

export function resumenDetenido(ok: number, restantes: number): string {
  const prefijo =
    ok > 0 ? `${ok} ingresado${ok === 1 ? "" : "s"}. ` : "";
  return `${prefijo}Lote detenido; quedan ${restantes} pendiente${restantes === 1 ? "" : "s"}.`;
}

export function resumenLote(
  ok: number,
  pendientes: CorreoFila[],
  totalLote: number,
): string {
  const fallos = pendientes.length;
  const primero = pendientes[0]?.ingreso?.error;
  if (ok > 0) {
    return `${ok} ingresado${ok === 1 ? "" : "s"}, ${fallos} fallaron. ${primero ?? ""}`.trim();
  }
  return `${fallos} de ${totalLote} fallaron. ${primero ?? "Revisa el motivo en cada fila."}`.trim();
}

export function motivoFallo(resultado: IngresoCorreo): string {
  return (
    resultado.error?.trim() || "El ingreso terminó en error. Revisa el correo."
  );
}

export async function ejecutarLoteReintentos(
  lote: CorreoFila[],
  callbacks: CallbacksLote,
): Promise<ResultadoLote> {
  const { signal, onProgreso, onActivo, onMarcarFila, onQuitarFila } = callbacks;
  const fallidas: CorreoFila[] = [];
  let ok = 0;
  let indiceCorte: number | null = null;
  let errorCorte: string | null = null;

  for (let indice = 0; indice < lote.length; indice += 1) {
    if (signal.aborted) {
      indiceCorte = indice;
      break;
    }
    const fila = lote[indice]!;
    onActivo(fila.messageId);
    onProgreso({
      hechos: indice + 1,
      total: lote.length,
      ok,
      asuntoActual: fila.asunto?.trim() || "(sin asunto)",
    });
    onMarcarFila(fila.messageId, enProcesoLocal(fila));
    try {
      const resultado = await esperarResultadoIngreso(fila.messageId, signal);
      if (resultado.estado === "ingresado") {
        ok += 1;
        onQuitarFila(fila.messageId);
      } else {
        const fallida = conErrorLocal(fila, motivoFallo(resultado));
        fallidas.push(fallida);
        onMarcarFila(fila.messageId, fallida);
      }
    } catch (causa) {
      if (esAbortado(causa) || signal.aborted) {
        onMarcarFila(fila.messageId, fila);
        indiceCorte = indice;
        break;
      }
      if (esErrorYaIngresado(causa)) {
        ok += 1;
        onQuitarFila(fila.messageId);
      } else {
        const motivo = textoError(causa);
        const fallida = conErrorLocal(fila, motivo);
        fallidas.push(fallida);
        onMarcarFila(fila.messageId, fallida);
        if (esErrorQueCortaLote(causa)) {
          errorCorte = motivo;
          indiceCorte = indice + 1;
          break;
        }
      }
    }
    if (indice < lote.length - 1) {
      try {
        await pausaEntreReintentos(signal);
      } catch {
        indiceCorte = indice + 1;
        break;
      }
    }
  }

  const sinProcesar = indiceCorte !== null ? lote.slice(indiceCorte) : [];
  const pendientes = [...fallidas, ...sinProcesar];
  if (pendientes.length === 0) return { ok, pendientes, error: null };
  const error = signal.aborted
    ? resumenDetenido(ok, pendientes.length)
    : resumenLote(ok, errorCorte ? fallidas : pendientes, lote.length);
  return { ok, pendientes, error };
}
