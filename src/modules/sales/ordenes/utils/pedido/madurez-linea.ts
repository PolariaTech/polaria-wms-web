import { extractMadurezEspecificacion } from "./resolve-cantidad-envase";

export type FilaMadurez = {
  producto: string;
  madurez: string;
};

const HEADER_MADUREZ =
  /^(?:niveles?\s+de\s+)?(?:maduraci[oó]n|madurez|firmeza)$/i;
const HEADER_PRODUCTO =
  /^(?:producto|texto breve(?:\s+de\s+material)?|descripci[oó]n|art[ií]culo|material)$/i;
const INLINE_NIVEL =
  /^(.+?)\s+(?:niveles?\s+de\s+)?(?:maduraci[oó]n|madurez|firmeza)\s*[:=]\s*(\S.*?)\s*$/i;

function norm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitCeldas(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];
  if (trimmed.includes("|")) {
    return trimmed
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
  }
  if (trimmed.includes("\t")) {
    return trimmed.split("\t").map((cell) => cell.trim());
  }
  return trimmed
    .split(/\s{2,}/)
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);
}

/** Celda de madurez: palabra conocida, nivel corto (3/4, listo para hoy) o vacío. */
export function nivelMadurezDesdeCelda(
  value: string | null | undefined,
): string | null {
  const raw = (value ?? "").trim().replace(/\s+/g, " ").replace(/[.:]+$/, "");
  if (!raw || raw.length > 40) return null;
  if (/^(?:n\/a|na|s\/n|-+|ninguno|ninguna|no)$/i.test(raw)) return null;
  const canon = extractMadurezEspecificacion(raw);
  if (canon) return canon;
  const numero = Number(raw.replace(",", "."));
  if (/^\d+(?:[.,]\d+)?$/.test(raw) && (!Number.isFinite(numero) || numero > 5)) {
    return null;
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function claveEsMadurez(key: string): boolean {
  const k = norm(key);
  return /^(?:niveles? de )?(?:maduracion|madurez|firmeza)$/.test(k);
}

/** Lee Madurez / Maduración / Firmeza si el renglón del correo trae esa columna. */
export function madurezDesdeRegistro(
  row: object | null | undefined,
): string | null {
  if (!row) return null;
  for (const [key, value] of Object.entries(row)) {
    if (!claveEsMadurez(key)) continue;
    if (typeof value !== "string" && typeof value !== "number") continue;
    const nivel = nivelMadurezDesdeCelda(String(value));
    if (nivel) return nivel;
  }
  return null;
}

/**
 * REQ-158: cada renglón de la tabla del correo (Pedidos · Aguacates de Puebla)
 * puede traer su nivel en una columna, no solo dentro del nombre.
 */
export function filasMadurezDesdeTexto(
  raw: string | null | undefined,
): FilaMadurez[] {
  const text = (raw ?? "").replace(/\r\n/g, "\n");
  if (!text.trim()) return [];

  const out: FilaMadurez[] = [];
  let productoIdx = -1;
  let madurezIdx = -1;

  for (const line of text.split("\n")) {
    const celdas = splitCeldas(line);
    if (celdas.length === 0) continue;

    const headerProducto = celdas.findIndex((cell) => HEADER_PRODUCTO.test(cell));
    const headerMadurez = celdas.findIndex((cell) => HEADER_MADUREZ.test(cell));
    if (headerProducto >= 0 && headerMadurez >= 0) {
      productoIdx = headerProducto;
      madurezIdx = headerMadurez;
      continue;
    }

    if (
      productoIdx >= 0 &&
      madurezIdx >= 0 &&
      celdas.length > Math.max(productoIdx, madurezIdx)
    ) {
      const producto = celdas[productoIdx]?.trim() ?? "";
      const madurez = nivelMadurezDesdeCelda(celdas[madurezIdx]);
      if (producto && madurez) out.push({ producto, madurez });
      continue;
    }

    const inline = line.trim().match(INLINE_NIVEL);
    if (!inline?.[1] || !inline[2]) continue;
    const producto = inline[1].trim();
    if (HEADER_MADUREZ.test(producto) || HEADER_PRODUCTO.test(producto)) continue;
    const madurez = nivelMadurezDesdeCelda(inline[2]);
    if (producto && madurez) out.push({ producto, madurez });
  }

  return out;
}

function nombresCoinciden(producto: string, fila: string): boolean {
  const a = norm(producto);
  const b = norm(fila);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function unirEspecificacion(
  actual: string | null | undefined,
  madurez: string | null,
): string | null {
  const base = actual?.trim() || "";
  if (!madurez) return base || null;
  if (!base) return madurez;
  if (norm(base).includes(norm(madurez))) return base;
  const nivelYaPuesto = extractMadurezEspecificacion(base);
  if (nivelYaPuesto && norm(nivelYaPuesto) !== norm(madurez)) {
    const resto = base
      .split(" · ")
      .map((part) => part.trim())
      .filter((part) => part && norm(part) !== norm(nivelYaPuesto))
      .join(" · ");
    return resto ? `${resto} · ${madurez}` : madurez;
  }
  return `${base} · ${madurez}`;
}

/**
 * Asigna un nivel a cada producto: columna del renglón, fila única de la tabla
 * y, si hay las mismas filas que productos, la misma posición.
 */
export function asignarMadurezAProductos(params: {
  productos: readonly string[];
  textoFuente?: string | null;
  madurezPorRenglon?: readonly (string | null | undefined)[];
}): (string | null)[] {
  const filas = filasMadurezDesdeTexto(params.textoFuente);
  const usados = new Set<number>();
  const porNombre = params.productos.map((producto) => {
    const hits = filas
      .map((fila, index) => ({ fila, index }))
      .filter(
        ({ fila, index }) =>
          !usados.has(index) && nombresCoinciden(producto, fila.producto),
      );
    if (hits.length !== 1) return null;
    usados.add(hits[0]!.index);
    return hits[0]!.fila.madurez;
  });
  const mismaCantidad =
    filas.length > 0 && filas.length === params.productos.length;

  return params.productos.map((producto, index) => {
    const delRenglon = nivelMadurezDesdeCelda(
      params.madurezPorRenglon?.[index] ?? null,
    );
    if (delRenglon) return delRenglon;
    if (porNombre[index]) return porNombre[index];
    if (mismaCantidad && !usados.has(index)) {
      return filas[index]?.madurez ?? extractMadurezEspecificacion(producto);
    }
    return extractMadurezEspecificacion(producto);
  });
}

export function aplicarMadurezDesdeTexto<
  T extends { textoOriginal: string; especificacion: string | null },
>(lineas: readonly T[], textoFuente: string | null | undefined): T[] {
  const niveles = asignarMadurezAProductos({
    productos: lineas.map((linea) => linea.textoOriginal),
    textoFuente,
  });
  return lineas.map((linea, index) => ({
    ...linea,
    especificacion: unirEspecificacion(linea.especificacion, niveles[index] ?? null),
  }));
}
