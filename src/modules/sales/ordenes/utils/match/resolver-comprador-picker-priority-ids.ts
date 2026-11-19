import type { CompradorListRow } from "@/modules/admin-panel";
import { sugerenciasCompradorParaPicker } from "./match-comprador-from-nombre";

function limpio(value: string | null | undefined): string {
  const t = (value ?? "").trim();
  return t && t !== "—" ? t : "";
}

/** Nombre con el que Mateo / el origen pide el cliente. */
export function nombreClienteParaSugerirPicker(params: {
  compradorNombreIa?: string | null;
  compradorLabel?: string | null;
  idComprador?: string | null;
  /** Primer «Nombre cliente» del origen_correo si existe. */
  nombreEnOrigen?: string | null;
}): string {
  const nombreIa = limpio(params.compradorNombreIa);
  if (nombreIa) return nombreIa;
  const enOrigen = limpio(params.nombreEnOrigen);
  if (enOrigen) return enOrigen;
  if (!limpio(params.idComprador)) return limpio(params.compradorLabel);
  return "";
}

/**
 * REQ-326: igual que productos — sugerencias primero + IDs para el badge «Sugerido».
 */
export function resolverCompradorPickerSugerencias(params: {
  compradores: readonly CompradorListRow[];
  compradorNombreIa?: string | null;
  compradorLabel?: string | null;
  idComprador?: string | null;
  nombreEnOrigen?: string | null;
  compradorSugerencias?: readonly CompradorListRow[];
}): {
  priorityIds: string[];
  /** Catálogo con sugerencias de Mateo arriba (mismo patrón que productos). */
  compradoresParaPicker: CompradorListRow[];
} {
  const catalogo = [...params.compradores];
  const nombre = nombreClienteParaSugerirPicker(params);

  let sugeridas: CompradorListRow[] = [];
  if (nombre && catalogo.length > 0) {
    sugeridas = sugerenciasCompradorParaPicker(nombre, catalogo, {
      minScore: 0.25,
    });
  }
  if (
    sugeridas.length === 0 &&
    !limpio(params.idComprador) &&
    (params.compradorSugerencias?.length ?? 0) > 0
  ) {
    sugeridas = [...(params.compradorSugerencias ?? [])];
  }

  const priorityIds = sugeridas.map((row) => row.idComprador);
  if (priorityIds.length === 0) {
    return { priorityIds: [], compradoresParaPicker: catalogo };
  }

  const rank = new Map(priorityIds.map((id, index) => [id, index]));
  const compradoresParaPicker = [...catalogo].sort((a, b) => {
    const ra = rank.has(a.idComprador) ? rank.get(a.idComprador)! : 10_000;
    const rb = rank.has(b.idComprador) ? rank.get(b.idComprador)! : 10_000;
    if (ra !== rb) return ra - rb;
    return 0;
  });

  return { priorityIds, compradoresParaPicker };
}

/** @deprecated usar resolverCompradorPickerSugerencias */
export function resolverCompradorPickerPriorityIds(params: {
  compradores: readonly CompradorListRow[];
  compradorNombreIa?: string | null;
  compradorLabel?: string | null;
  idComprador?: string | null;
  compradorSugerencias?: readonly CompradorListRow[];
  nombreEnOrigen?: string | null;
}): string[] {
  return resolverCompradorPickerSugerencias(params).priorityIds;
}
