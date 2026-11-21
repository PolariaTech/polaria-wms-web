import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { colorClienteDesambiguaSugerencia } from "./color-desambigua-auto-accept";
import {
  codigoCoincideEnQuery,
  coreProductNameForMatch,
  esProductoNoMercancia,
  productNamesLooselyMatch,
  unmatchedDistinctiveQueryTokens,
} from "./find-closest-producto-catalogo";
import { normalizeForMatch } from "./normalize-for-match";
import { matchRequiereConfirmacionPorVariedadOCalibre } from "./variedad-calibre-match";

/**
 * Decide si una sugerencia fuzzy se puede auto-asignar (sin pedir “Usar esta”).
 */
export function shouldAutoAcceptProductoSuggestion(params: {
  query: string;
  sugerenciaNombre: string;
  sugerenciaCodigo: string;
  topScore: number;
  secondScore: number | null;
  ambiguous: boolean;
}): boolean {
  const q = normalizeForMatch(params.query);
  const n = normalizeForMatch(params.sugerenciaNombre);
  const c = normalizeForMatch(params.sugerenciaCodigo);
  if (!q) return false;
  // Nombre o código exacto (normalizado) → asignar; no pedir «Usar esta».
  if (q === n || q === c) return true;
  // Código en el texto solo si es coincidencia real (no "5" dentro de "25 cm" / "5 litros").
  if (codigoCoincideEnQuery(params.query, params.sugerenciaCodigo)) return true;
  // Nunca auto-asignar anticipos/servicios si el texto del cliente no los pide.
  if (
    esProductoNoMercancia({
      nombre: params.sugerenciaNombre,
      codigo: params.sugerenciaCodigo,
    }) &&
    !/\b(anticipo|servicio|cuota)\b/.test(q)
  ) {
    return false;
  }

  const sugerenciaSynth: ProductoVentaOption = {
    idProducto: "_",
    label: params.sugerenciaNombre,
    idCliente: null,
    idBodega: "",
    codigo: params.sugerenciaCodigo,
    nombre: params.sugerenciaNombre,
    kgDisponible: 0,
    precioUnitario: 0,
    unidadMedida: "kg",
  };
  // REQ-369: no auto-aceptar si el cliente pide variedad/calibre que el SKU no cubre.
  if (
    matchRequiereConfirmacionPorVariedadOCalibre({
      textoCliente: params.query,
      nombreCatalogo: params.sugerenciaNombre,
      codigoYaCoincide: false,
      unmatchedDistinctiveTokens: unmatchedDistinctiveQueryTokens(
        params.query,
        sugerenciaSynth,
      ),
    })
  ) {
    return false;
  }

  // Mismo producto aunque cambien gramos/talla en el texto (260g vs 250g).
  const coreQ = coreProductNameForMatch(params.query);
  const coreN = coreProductNameForMatch(params.sugerenciaNombre);
  if (coreQ.length >= 4 && coreQ === coreN) {
    // «chile jalapeño» genérico vs dos tallas: no auto si quedó ambiguo y sin talla en el query.
    const queryTraeTalla = /\d/.test(params.query);
    if (!params.ambiguous || queryTraeTalla) return true;
    if (
      params.secondScore != null &&
      params.topScore - params.secondScore >= 0.08
    ) {
      return true;
    }
  }

  if (n.includes(q) && q.length >= 4 && params.topScore >= 0.75) {
    // Query contenido en el nombre del catálogo (ej. «PIÑA» ⊂ «PIÑA …»).
    if (
      params.secondScore == null ||
      params.topScore - params.secondScore >= 0.08
    ) {
      return true;
    }
  }
  if (productNamesLooselyMatch(params.query, params.sugerenciaNombre)) {
    // Nombre del cliente ≈ nombre catálogo: auto si no hay rival muy cerca.
    if (params.secondScore == null) return true;
    if (params.topScore - params.secondScore >= 0.08) return true;
    if (params.topScore >= 0.7 && params.secondScore < 0.55) return true;
  }
  if (
    colorClienteDesambiguaSugerencia({
      query: params.query,
      sugerenciaNombre: params.sugerenciaNombre,
      topScore: params.topScore,
      secondScore: params.secondScore,
    })
  ) {
    return true;
  }

  if (params.topScore >= 0.7 && !params.ambiguous) return true;
  if (
    params.topScore >= 0.85 &&
    (params.secondScore == null || params.topScore - params.secondScore >= 0.12)
  ) {
    return true;
  }
  return false;
}
