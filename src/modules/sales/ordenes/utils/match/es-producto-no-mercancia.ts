import { normalizeForMatch } from "./normalize-for-match";

export function esProductoNoMercancia(producto: {
  nombre?: string | null;
  codigo?: string | null;
  unidadMedida?: string | null;
}): boolean {
  const n = normalizeForMatch(producto.nombre ?? "");
  const u = normalizeForMatch(producto.unidadMedida ?? "");
  if (!n) return false;
  if (
    /\b(anticipo|servicio|cuota|imss|rcv|fiscal|actualizacion|adaptacion|mejora)\b/.test(
      n,
    )
  ) {
    return true;
  }
  if (u === "act" || u === "ser" || u === "pag") return true;
  return false;
}