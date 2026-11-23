import { parseDecimalEs } from "@/lib/utils/decimal-es";
import type { CompradorProductoAliasListRow } from "../services/comprador-producto-alias.service";
import type { CompradorAltaFormState } from "../utils/comprador-alta";
import type { CompradorEquivalenciaDraft } from "./CompradorEquivalenciasTable";

export function serializeForm(form: CompradorAltaFormState): string {
  return JSON.stringify(form);
}

export function precioToTexto(precio: number | null): string {
  if (precio == null) return "";
  return String(precio);
}

export function draftsFromRows(
  rows: CompradorProductoAliasListRow[],
): Record<string, CompradorEquivalenciaDraft> {
  return Object.fromEntries(
    rows.map((row) => [
      row.idAlias,
      {
        alias: row.alias,
        precioTexto: precioToTexto(row.precio),
      },
    ]),
  );
}

export function isSamePrecio(
  original: number | null,
  precioTexto: string,
): boolean {
  const trimmed = precioTexto.trim();
  if (original == null) {
    return trimmed === "";
  }
  if (trimmed === "") return false;
  const parsed = parseDecimalEs(trimmed);
  if (parsed == null) return false;
  return Math.abs(parsed - original) < 1e-9;
}
