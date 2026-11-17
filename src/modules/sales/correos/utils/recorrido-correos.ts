import type { ModoCorreos } from "../types/correos.types";

const CLAVE = "polaria.ventas.correos.recorrido";

export interface RecorridoCorreos {
  modo: ModoCorreos;
  ids: string[];
}

function esModo(valor: unknown): valor is ModoCorreos {
  return valor === "todos" || valor === "descartados" || valor === "procesados";
}

/** Guarda los ids del bloque vigente al salir de la lista hacia un correo. */
export function guardarRecorrido(recorrido: RecorridoCorreos): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(recorrido));
  } catch {
    // Sin almacenamiento, Anterior/Siguiente no aparecen.
  }
}

export function leerRecorrido(): RecorridoCorreos | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.sessionStorage.getItem(CLAVE);
    if (!crudo) return null;
    const parsed: unknown = JSON.parse(crudo);
    if (!parsed || typeof parsed !== "object") return null;
    const { modo, ids } = parsed as { modo?: unknown; ids?: unknown };
    if (!esModo(modo) || !Array.isArray(ids)) return null;
    if (!ids.every((id) => typeof id === "string" && id.length > 0)) return null;
    return { modo, ids };
  } catch {
    return null;
  }
}
