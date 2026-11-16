import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { normalizeForMatch } from "./normalize-for-match";

const PREP_RE =
  /\b(jugo|jugos|juice|zumo|zumos|pure|pures|puree|nectar|nectares|extracto|extractos)\b/;

/**
 * Jugo/puré/néctar en catálogo vs pedido de fruta entera (o al revés).
 * REQ-311: pimiento/chile fresco ≠ pulpa/recado (pero «Frutos rojos» sí puede ser PULPA).
 */
export function productoPreparacionIncompatibleConTexto(
  textoCliente: string | null | undefined,
  producto: ProductoVentaOption,
): boolean {
  const texto = normalizeForMatch(textoCliente ?? "");
  const nombre = normalizeForMatch(producto.nombre ?? "");
  if (!texto || !nombre) return false;

  const textoPidePrep = PREP_RE.test(texto);
  const productoEsPrep = PREP_RE.test(nombre);
  if (productoEsPrep !== textoPidePrep) return true;
  if (
    /\b(pulpa|pulpas|recado|recados)\b/.test(nombre) &&
    /\b(pimiento|pimientos|chile|chiles|morron|morrones)\b/.test(texto)
  ) {
    return true;
  }
  return false;
}
