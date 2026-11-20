import { familiaUnidadCatalogo } from "./resolve-cantidad-envase";

/**
 * REQ-363: unidad de la línea del pedido (general, no por cliente).
 * El documento / Mateo manda sobre el catálogo cuando piden otra familia
 * (KG↔PZA↔LTR). Así el mismo SKU (p. ej. Coliflor en PZA) puede ir en KGM
 * si la OC pide kilos, o en PZA si pide piezas.
 */

function normalizarUnidadPedido(raw: string | null | undefined): string {
  const t = (raw ?? "").trim().toUpperCase().replace(/\./g, "");
  if (!t) return "";
  if (/^(KGM|KG|KILO|KILOS|KGS)$/.test(t)) return "KGM";
  if (/^(LTR|LT|L|LITRO|LITROS|LTS|ML)$/.test(t)) return "LTR";
  if (/^(PZA|PZ|PZS|PIEZA|PIEZAS|UN|UND|UNIDAD|UNIDADES)$/.test(t))
    return "PZA";
  return t;
}

function unidadDesdeTextoLibre(texto: string): string {
  const t = texto.toLowerCase();
  if (/\b(litros?|lts?|\bml\b)\b/.test(t)) return "LTR";
  if (/\b(kilos?|kgs?|\bkg\b)\b/.test(t)) return "KGM";
  if (/\b(piezas?|pzas?|\bpz\b)\b/.test(t)) return "PZA";
  return "";
}

/** Unidad tipada de Mateo (`LineaExtraida.unidad`) desde texto libre / origen. */
export function unidadMateoDesdeRaw(
  raw: string | null | undefined,
): "KGM" | "CJ" | "UN" | null {
  const t = (raw ?? "").trim().toUpperCase().replace(/\./g, "");
  if (!t) return null;
  if (/^(KGM|KG|KGS|KILO|KILOS)$/.test(t)) return "KGM";
  if (/^(CJ|CAJA|CAJAS)$/.test(t)) return "CJ";
  if (/^(UN|UND|PZA|PZ|PIEZA|PIEZAS)$/.test(t)) return "UN";
  return null;
}

export function resolveUnidadPedidoLinea(params: {
  /** Unidad que Mateo/origen guardó en el renglón. */
  unidadOrigen?: string | null;
  /** Unidad del producto de catálogo. */
  unidadCatalogo?: string | null;
  /** Texto del producto / línea del pedido (PDF, correo, Solicitado). */
  textoProducto?: string | null;
  /** Especificación u otras notas donde a veces viene la unidad. */
  textoExtra?: string | null;
}): string {
  const texto =
    `${params.textoProducto ?? ""} ${params.textoExtra ?? ""}`.trim();
  const fromText = unidadDesdeTextoLibre(texto);
  const fromOrigen = normalizarUnidadPedido(params.unidadOrigen);
  const catRaw = params.unidadCatalogo?.trim() || "";
  const catNorm = normalizarUnidadPedido(catRaw);
  const famCat = familiaUnidadCatalogo(catNorm || catRaw);
  const famText = familiaUnidadCatalogo(fromText);
  const famOrigen = familiaUnidadCatalogo(fromOrigen);

  // Litros/kg en el texto (p. ej. «galón de 5 litros» con Unidad UN) mandan
  // sobre UN/PZA del origen: es la unidad de contenido, no del envase.
  if (fromText === "LTR") {
    if (famCat === "ltr" && catRaw) return catRaw;
    return "LTR";
  }
  if (fromText === "KGM") {
    if (famCat === "kg" && catRaw) return catRaw;
    return "KGM";
  }

  // Pedido (origen o texto) vs otra familia de catálogo → gana el pedido.
  if (fromOrigen === "LTR" && famCat !== "ltr") return "LTR";
  if (fromOrigen === "KGM" && famCat !== "kg") return "KGM";
  if (fromOrigen === "PZA" && famCat !== "pza") return "PZA";
  if (fromText === "PZA" && famCat !== "pza") return "PZA";

  // Misma familia: conservar el string del catálogo (p. ej. "kg").
  if (catRaw && fromOrigen && famOrigen === famCat) return catRaw;
  if (catRaw && fromText && famText === famCat) return catRaw;
  if (fromOrigen && (famCat === "unknown" || !catRaw)) return fromOrigen;
  if (fromText && (famCat === "unknown" || !catRaw)) return fromText;
  if (catRaw) return catRaw;
  return fromOrigen || fromText || "";
}

/** REQ-363: unidad de línea en el form (pedido/documento vs catálogo). */
export function unidadLineaPedidoForm(
  texto: string,
  unidadCatalogo: string,
  unidadOrigen?: string | null,
  especificacion?: string | null,
): string {
  return (
    resolveUnidadPedidoLinea({
      unidadOrigen,
      unidadCatalogo,
      textoProducto: texto,
      textoExtra: especificacion,
    }) || unidadCatalogo.trim()
  );
}

