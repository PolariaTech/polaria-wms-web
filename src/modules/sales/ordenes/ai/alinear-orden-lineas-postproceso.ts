/**
 * REQ-369 / REQ-370: Mateo a veces emite `lineas` en orden distinto al del PDF
 * (alfabético, por almacén, etc.). Realineamos con el texto del documento y/o
 * con las filas de `cuerpoMensaje` tipo=tabla cuando hay anclas fiables.
 */

function normalize(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function anclasLinea(linea: {
  textoOriginal?: string | null;
  productoCatalogo?: string | null;
  codigoProductoCliente?: string | null;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string | null | undefined) => {
    const n = normalize(raw ?? "");
    if (n.length < 3 || seen.has(n)) return;
    seen.add(n);
    out.push(n);
  };
  push(linea.textoOriginal);
  push(linea.codigoProductoCliente);
  // Nombre de catálogo sin SKU final: ayuda si el PDF solo trae el nombre corto.
  const catalogo = (linea.productoCatalogo ?? "").replace(/\s*\([^()]*\)\s*$/, "");
  push(catalogo);
  // Prefijo de palabras significativas: OCR a veces trunca o añade calificadores.
  const palabras = normalize(linea.textoOriginal ?? "")
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 4);
  if (palabras.length >= 2) push(palabras.slice(0, 2).join(" "));
  if (palabras.length >= 3) push(palabras.slice(0, 3).join(" "));
  return out;
}

function scoreFilaVsLinea(
  filaNorm: string,
  linea: {
    textoOriginal?: string | null;
    productoCatalogo?: string | null;
    codigoProductoCliente?: string | null;
  },
): number {
  if (!filaNorm) return 0;
  let best = 0;
  for (const ancla of anclasLinea(linea)) {
    if (filaNorm.includes(ancla)) {
      best = Math.max(best, 50 + Math.min(ancla.length, 40));
      continue;
    }
    // Subcadena larga del ancla (evita exigir el nombre completo si el PDF trunca).
    if (ancla.length >= 8) {
      const trozo = ancla.slice(0, Math.min(18, ancla.length));
      if (filaNorm.includes(trozo)) {
        best = Math.max(best, 30 + trozo.length);
      }
    }
  }
  return best;
}

function ordenDesdeTabla<T extends {
  textoOriginal?: string | null;
  productoCatalogo?: string | null;
  codigoProductoCliente?: string | null;
}>(
  lineas: readonly T[],
  filasTabla: readonly (readonly string[])[],
): T[] | null {
  if (filasTabla.length < 2 || lineas.length < 2) return null;
  // Primera fila = encabezados (prompt); el resto son productos.
  const dataRows = filasTabla.slice(1);
  if (dataRows.length === 0) return null;

  const remaining = lineas.map((linea, index) => ({ linea, index }));
  const ordered: T[] = [];
  let matched = 0;

  for (const row of dataRows) {
    const filaNorm = normalize(row.join(" "));
    if (!filaNorm) continue;
    let bestJ = -1;
    let bestScore = 0;
    for (let j = 0; j < remaining.length; j += 1) {
      const score = scoreFilaVsLinea(filaNorm, remaining[j]!.linea);
      if (score > bestScore) {
        bestScore = score;
        bestJ = j;
      }
    }
    if (bestJ < 0 || bestScore < 30) continue;
    ordered.push(remaining[bestJ]!.linea);
    remaining.splice(bestJ, 1);
    matched += 1;
  }

  // Exigir mayoría de líneas ancladas; si no, no tocamos el orden del modelo.
  if (matched < Math.ceil(lineas.length * 0.6)) return null;

  remaining.sort((a, b) => a.index - b.index);
  for (const item of remaining) ordered.push(item.linea);
  return ordered;
}

function posicionEnFuente(
  linea: {
    textoOriginal?: string | null;
    productoCatalogo?: string | null;
    codigoProductoCliente?: string | null;
  },
  fuenteNorm: string,
  ocupadoHasta: number,
): number {
  let best = Number.POSITIVE_INFINITY;
  for (const ancla of anclasLinea(linea)) {
    let from = 0;
    while (from < fuenteNorm.length) {
      const idx = fuenteNorm.indexOf(ancla, from);
      if (idx < 0) break;
      if (idx >= ocupadoHasta && idx < best) {
        best = idx;
        break;
      }
      from = idx + 1;
    }
  }
  return best;
}

function ordenDesdeFuente<T extends {
  textoOriginal?: string | null;
  productoCatalogo?: string | null;
  codigoProductoCliente?: string | null;
}>(lineas: readonly T[], fuenteDocumento: string): T[] | null {
  const fuenteNorm = normalize(fuenteDocumento);
  if (fuenteNorm.length < 20 || lineas.length < 2) return null;

  const scored = lineas.map((linea, index) => ({
    linea,
    index,
    pos: Number.POSITIVE_INFINITY as number,
  }));

  // Asignación greedy: cada línea toma la primera ocurrencia libre de su ancla.
  let cursor = 0;
  const byOrig = [...scored].sort((a, b) => a.index - b.index);
  // Varias pasadas suaves: primero las que tienen ancla larga/única.
  const pendientes = [...byOrig];
  const asignados: typeof scored = [];

  while (pendientes.length > 0) {
    let bestI = -1;
    let bestPos = Number.POSITIVE_INFINITY;
    for (let i = 0; i < pendientes.length; i += 1) {
      const pos = posicionEnFuente(pendientes[i]!.linea, fuenteNorm, cursor);
      if (pos < bestPos) {
        bestPos = pos;
        bestI = i;
      }
    }
    if (bestI < 0 || !Number.isFinite(bestPos)) {
      // Sin más anclas: el resto conserva orden original relativo.
      for (const item of pendientes) {
        asignados.push({ ...item, pos: Number.POSITIVE_INFINITY });
      }
      break;
    }
    const chosen = pendientes.splice(bestI, 1)[0]!;
    asignados.push({ ...chosen, pos: bestPos });
    cursor = bestPos + 1;
  }

  const conPos = asignados.filter((a) => Number.isFinite(a.pos));
  if (conPos.length < Math.ceil(lineas.length * 0.6)) return null;

  asignados.sort((a, b) => {
    const aInf = !Number.isFinite(a.pos);
    const bInf = !Number.isFinite(b.pos);
    if (aInf && bInf) return a.index - b.index;
    if (aInf) return 1;
    if (bInf) return -1;
    if (a.pos !== b.pos) return a.pos - b.pos;
    return a.index - b.index;
  });

  return asignados.map((a) => a.linea);
}

function mismoOrden<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Devuelve las líneas en orden del documento cuando hay anclas suficientes.
 * Si no hay señal fiable, deja el orden de Mateo intacto.
 */
export function alinearOrdenLineasConDocumento<T extends {
  textoOriginal?: string | null;
  productoCatalogo?: string | null;
  codigoProductoCliente?: string | null;
}>(
  lineas: readonly T[],
  fuenteDocumento: string,
  filasTablaCuerpo?: readonly (readonly string[])[] | null,
): T[] {
  if (lineas.length <= 1) return [...lineas];

  const desdeTabla =
    filasTablaCuerpo && filasTablaCuerpo.length > 0
      ? ordenDesdeTabla(lineas, filasTablaCuerpo)
      : null;
  if (desdeTabla && !mismoOrden(lineas, desdeTabla)) return desdeTabla;

  const desdeFuente = ordenDesdeFuente(lineas, fuenteDocumento);
  if (desdeFuente && !mismoOrden(lineas, desdeFuente)) return desdeFuente;

  return [...lineas];
}
