import { convert as htmlToText } from "html-to-text";

// Adjunto/cuerpo .html real encontrado en correos de sistemas automáticos de PO
// (Marriott/Sheraton): traen la orden de compra completa renderizada como HTML. Se
// convierte a texto plano en vez de mandarle el markup crudo a la IA (ruido de tags,
// estilos, y entidades HTML sin decodificar como "&Oacute;").
// Tablas HTML → dataTable (columnas alineadas); el default de html-to-text aplasta
// celdas en una sola línea o en lista vertical ilegible.
export function extractFromHtml(buffer: Buffer): string {
  return htmlToText(buffer.toString("utf8"), {
    wordwrap: false,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
      {
        selector: "table",
        format: "dataTable",
        options: {
          uppercaseHeaderCells: false,
          // 32 cortaba celdas (“Baja” / “California”) y rompía la tabla.
          maxColumnWidth: 200,
        },
      },
    ],
  }).trim();
}

function htmlTieneTabla(html: string): boolean {
  return /<table[\s>]/i.test(html);
}

/**
 * REQ-343 (general): text/plain de Outlook/Gmail con tabla aplastada =
 * muchas líneas cortas seguidas y ninguna fila con columnas alineadas.
 */
export function plainPareceTablaAplastada(plain: string): boolean {
  const lines = plain
    .split(/\r?\n/)
    .map((line) => line.replace(/\u00a0/g, " ").trim())
    .filter(Boolean);
  if (lines.length < 6) return false;
  let shortRun = 0;
  let maxShortRun = 0;
  let multiCol = 0;
  for (const line of lines) {
    const cols = line.split(/ {2,}/).filter(Boolean).length;
    if (cols >= 3) {
      multiCol += 1;
      shortRun = 0;
      continue;
    }
    if (line.length <= 48 && !/[.!?…]$/.test(line)) {
      shortRun += 1;
      maxShortRun = Math.max(maxShortRun, shortRun);
    } else {
      shortRun = 0;
    }
  }
  return maxShortRun >= 5 && multiCol === 0;
}

/**
 * El text/plain de Outlook/Gmail suele “aplastar” tablas (una celda por línea).
 * Si hay HTML con <table>, preferimos ese camino con dataTable (cualquier cliente).
 */
export function extractCuerpoCorreo(parsed: {
  text?: string | null;
  html?: string | false | null;
}): string {
  const plain = parsed.text?.trim() || "";
  const htmlRaw =
    typeof parsed.html === "string" && parsed.html.trim()
      ? parsed.html
      : "";
  const fromHtml = htmlRaw ? extractFromHtml(Buffer.from(htmlRaw)) : "";
  const htmlConTabla = Boolean(htmlRaw && htmlTieneTabla(htmlRaw) && fromHtml);

  if (htmlConTabla) return fromHtml;
  // Plain aplastado + HTML útil aunque no detectemos <table> crudo (p. ej. basura MSO).
  if (fromHtml && plain && plainPareceTablaAplastada(plain)) return fromHtml;
  return plain || fromHtml;
}
