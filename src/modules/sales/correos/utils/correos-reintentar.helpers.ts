import { CorreosApiError, listarCorreos } from "../services/correos.client";
import {
  FILTROS_CORREOS_VACIOS,
  TAMANO_BLOQUE_CORREOS,
  type CorreoFila,
  type IngresoCorreo,
} from "../types/correos.types";
import { mensajeDeError } from "./correos-formato";

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
