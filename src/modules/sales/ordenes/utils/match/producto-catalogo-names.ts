import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { normalizeForMatch } from "./normalize-for-match";
import { scoreProductoMatch } from "./score-producto-match";

export function productNamesLooselyMatch(a: string, b: string): boolean {
  const left = (a ?? "").trim();
  const right = (b ?? "").trim();
  if (!left || !right) return false;

  const na = normalizeForMatch(left);
  const nb = normalizeForMatch(right);
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;

  const synthetic: ProductoVentaOption = {
    idProducto: "_",
    label: right,
    idCliente: null,
    idBodega: "",
    codigo: "",
    nombre: right,
    kgDisponible: 0,
    precioUnitario: 0,
    unidadMedida: "kg",
  };
  if (scoreProductoMatch(left, synthetic) >= 0.45) return true;

  const syntheticB: ProductoVentaOption = {
    ...synthetic,
    nombre: left,
    label: left,
  };
  return scoreProductoMatch(right, syntheticB) >= 0.45;
}

export function coreProductNameForMatch(value: string): string {
  return normalizeForMatch(value)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:a|al|a|-|–|—)\s*\d+(?:[.,]\d+)?\s*(?:g|kg|cm|mm|pza|pz)?\b/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:g|kg|cm|mm|pza|pz|kilos?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}