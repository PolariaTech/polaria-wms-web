import { familiaUnidadCatalogo } from "./resolve-cantidad-envase";

/**
 * REQ-380: con SKU de catálogo, la unidad de la línea es la del catálogo.
 * La unidad del pedido/correo (otra familia) no pisa el catálogo: va a
 * especificación vía `fraseUnidadPedidoDiscrepante`.
 * Sin catálogo, se conserva origen/texto como antes.
 */

function normalizarUnidadPedido(raw: string | null | undefined): string {
  const t = (raw ?? "").trim().toUpperCase().replace(/\./g, "");
  if (!t) return "";
  if (/^(KGM|KG|KILO|KILOS|KGS)$/.test(t)) return "KGM";
  if (/^(LTR|LT|L|LITRO|LITROS|LTS|ML)$/.test(t)) return "LTR";
  if (/^(PZA|PZ|PZS|PIEZA|PIEZAS|UN|UND|UNIDAD|UNIDADES)$/.test(t))
    return "PZA";
  if (/^(CJ|CAJA|CAJAS)$/.test(t)) return "CJ";
  return t;
}

function unidadDesdeTextoLibre(texto: string): string {
  const t = texto.toLowerCase();
  if (/\b(litros?|lts?|\bml\b)\b/.test(t)) return "LTR";
  if (/\b(kilos?|kgs?|\bkg\b)\b/.test(t)) return "KGM";
  if (/\b(piezas?|pzas?|\bpz\b)\b/.test(t)) return "PZA";
  return "";
}

function unidadPedidoDetectada(params: {
  unidadOrigen?: string | null;
  textoProducto?: string | null;
  textoExtra?: string | null;
}): string {
  const texto =
    `${params.textoProducto ?? ""} ${params.textoExtra ?? ""}`.trim();
  const fromOrigen = normalizarUnidadPedido(params.unidadOrigen);
  const fromText = unidadDesdeTextoLibre(texto);
  // Litros/kg en el texto (contenido) mandan sobre UN/PZA del origen.
  if (fromText === "LTR" || fromText === "KGM") return fromText;
  return fromOrigen || fromText || "";
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
  const catRaw = params.unidadCatalogo?.trim() || "";
  // REQ-380: con catálogo, siempre la unidad del SKU.
  if (catRaw) return catRaw;

  const fromPedido = unidadPedidoDetectada(params);
  if (fromPedido) return fromPedido;
  return "";
}

/**
 * REQ-380: si el pedido pide otra familia que el catálogo, frase para
 * especificación (p. ej. «Pedido en PZA»). Vacío si no hay discrepancia.
 */
export function fraseUnidadPedidoDiscrepante(params: {
  unidadOrigen?: string | null;
  unidadCatalogo?: string | null;
  textoProducto?: string | null;
  textoExtra?: string | null;
}): string {
  const catRaw = params.unidadCatalogo?.trim() || "";
  if (!catRaw) return "";
  const fromPedido = unidadPedidoDetectada(params);
  if (!fromPedido) return "";
  const famCat = familiaUnidadCatalogo(
    normalizarUnidadPedido(catRaw) || catRaw,
  );
  const famPedido = familiaUnidadCatalogo(fromPedido);
  if (famPedido === "unknown" || famCat === "unknown") return "";
  if (famPedido === famCat) return "";
  return `Pedido en ${fromPedido}`;
}

/** Unidad de línea en el form: catálogo si hay SKU; si no, pedido/documento. */
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
