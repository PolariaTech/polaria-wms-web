import {
  CUERPO_BLOQUE_TABLA,
  CUERPO_BLOQUE_TEXTO,
  cleanCorreoBodyForNotas,
  isCuerpoMensajeFormato,
  looksLikeAsciiTableRow,
  mergeWrappedTableLines,
  splitCuerpoFila,
  type OrigenPedidoBlock,
} from "./texto-origen-pedido-correo";

function parseCuerpoMensajeFormato(raw: string): OrigenPedidoBlock[] | null {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!isCuerpoMensajeFormato(text)) return null;

  const blocks: OrigenPedidoBlock[] = [];
  const parts = text.split(/(?=^\[\[(?:texto|tabla)\]\]\s*$)/m);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const firstNl = trimmed.indexOf("\n");
    const marker = (firstNl === -1 ? trimmed : trimmed.slice(0, firstNl)).trim();
    const body = (firstNl === -1 ? "" : trimmed.slice(firstNl + 1)).trim();
    if (marker === CUERPO_BLOQUE_TABLA) {
      const rows = body
        .split("\n")
        .map((line) => splitCuerpoFila(line))
        .filter((row) => row.some((cell) => cell.length > 0));
      if (rows.length === 0) continue;
      const colCount = Math.max(...rows.map((row) => row.length), 0);
      blocks.push({
        type: "table",
        rows: rows.map((row) => {
          const next = [...row];
          while (next.length < colCount) next.push("");
          return next;
        }),
      });
      continue;
    }
    if (marker === CUERPO_BLOQUE_TEXTO && body) {
      blocks.push({ type: "text", text: body });
    }
  }
  return blocks.length > 0 ? blocks : null;
}

function parseAsciiOrigenPedidoBlocks(raw: string): OrigenPedidoBlock[] {
  const text = cleanCorreoBodyForNotas(raw);
  if (!text) return [];

  const lines = mergeWrappedTableLines(text.split("\n"));
  const blocks: OrigenPedidoBlock[] = [];
  let prose: string[] = [];
  let tableLines: string[] = [];

  const flushProse = () => {
    const joined = prose.join("\n").trim();
    if (joined) blocks.push({ type: "text", text: joined });
    prose = [];
  };

  const flushTable = () => {
    if (tableLines.length === 0) return;
    const rows = tableLines.map((line) =>
      line.replace(/[ \t]+$/g, "").split(/ {2,}/).map((cell) => cell.trim()),
    );
    const colCount = Math.max(...rows.map((r) => r.length), 0);
    if (colCount >= 3 && rows.length >= 1) {
      const normalized = rows.map((row) => {
        const next = [...row];
        while (next.length < colCount) next.push("");
        return next;
      });
      blocks.push({ type: "table", rows: normalized });
    } else {
      prose.push(...tableLines);
    }
    tableLines = [];
  };

  for (const line of lines) {
    if (looksLikeAsciiTableRow(line)) {
      if (prose.length) flushProse();
      tableLines.push(line);
      continue;
    }
    if (tableLines.length) flushTable();
    prose.push(line);
  }
  flushTable();
  flushProse();

  return blocks;
}

/**
 * Parte el cuerpo en prosa + tablas (formato IA [[tabla]] o ASCII de 2+ espacios).
 */
export function parseOrigenPedidoBlocks(raw: string): OrigenPedidoBlock[] {
  return parseCuerpoMensajeFormato(raw) ?? parseAsciiOrigenPedidoBlocks(raw);
}
