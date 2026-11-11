import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { productoCompatibleConTextoCliente } from "./find-closest-producto-catalogo";

function codigoComparable(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\s+/g, "").toLowerCase();
}

function textoSinElCodigo(texto: string, codigoLeido: string): string {
  const recorte = codigoLeido.replace(/\s+/g, "");
  if (!recorte) return texto.trim();
  const escaped = recorte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return texto
    .replace(new RegExp(escaped, "gi"), " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** REQ-299: el código leído apunta a este producto, pero el texto del cliente pide otra cosa. */
export function codigoContradiceNombre(
  textoCliente: string | null | undefined,
  codigoLeido: string | null | undefined,
  producto: ProductoVentaOption,
): boolean {
  const codigo = codigoComparable(codigoLeido);
  if (!codigo || codigo !== codigoComparable(producto.codigo)) return false;
  const textoRestante = textoSinElCodigo(textoCliente ?? "", codigoLeido ?? "");
  if (!textoRestante) return false;
  return !productoCompatibleConTextoCliente(textoRestante, producto);
}
