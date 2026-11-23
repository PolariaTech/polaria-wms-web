import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { nombresContradicenPorColor } from "../origen/identidad-nombres-producto";
import { codigoCoincideEnQuery } from "./codigo-coincide-en-query";
import { esProductoNoMercancia } from "./es-producto-no-mercancia";
import { unmatchedDistinctiveQueryTokens } from "./matches-producto-catalog-search";
import { productoPreparacionIncompatibleConTexto } from "./producto-preparacion-incompatible";
import { productosFamiliasSinonimoConflictivas } from "./producto-familias-sinonimo-conflictivas";
import { scoreProductoMatch } from "./score-producto-match";
import { matchRequiereConfirmacionPorVariedadOCalibre } from "./variedad-calibre-match";

export function productoCompatibleConTextoCliente(
  textoCliente: string | null | undefined,
  producto: ProductoVentaOption,
  opts?: { codigoYaCoincide?: boolean },
): boolean {
  const texto = (textoCliente ?? "").trim();
  if (!texto) return true;
  const codigoYaCoincide = Boolean(opts?.codigoYaCoincide);
  if (codigoCoincideEnQuery(texto, producto.codigo)) return true;
  if (productoPreparacionIncompatibleConTexto(texto, producto)) return false;
  if (productosFamiliasSinonimoConflictivas(texto, producto)) return false;
  if (nombresContradicenPorColor(texto, producto.nombre)) return false;
  if (
    !codigoYaCoincide &&
    matchRequiereConfirmacionPorVariedadOCalibre({
      textoCliente: texto,
      nombreCatalogo: producto.nombre,
      codigoYaCoincide: false,
      unmatchedDistinctiveTokens: unmatchedDistinctiveQueryTokens(
        texto,
        producto,
      ),
    })
  ) {
    return false;
  }

  const score = scoreProductoMatch(texto, producto);
  if (esProductoNoMercancia(producto)) {
    return score >= 0.55;
  }
  return score >= 0.42;
}