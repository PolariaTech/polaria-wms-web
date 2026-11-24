/**
 * Corrige confusiones típicas de extracción:
 * - Columnas "Usuario" / IDs de centro de costo usados como OC/PO
 * - "Oc Generada" / OC real del documento ignorada
 *
 * Ejemplo Xcaret: Usuario=3672091 ≠ Oc Generada=4501056534.
 * Sin este paso, mismo PO + mismo almacén se parte en varias OTs.
 */

import {
  collectFrequentNumericOcs,
  collectFromFilenames,
  collectFromLabels,
  collectFromRequisicionLabels,
  isGarbageOcValue,
  looksLikeArticuloSku,
  looksLikeOcCode,
  looksLikeUsuarioId,
} from "./normalize-numero-pedido-patrones";

export { isGarbageOcValue };

export type LineaConPedido = {
  numeroPedido: string | null;
  almacen: string | null;
  /** Si existía, se conserva; si unificamos y el pedido viejo era Usuario, se mueve aquí. */
  numeroAlmacen?: string | null;
};

/**
 * Detecta la OC/PO canónica del documento (texto + nombres de archivo).
 * Prioriza etiquetas explícitas y nombres tipo `4501056534_PEDIDO.pdf`.
 */
export function detectOrdenCompraFromSource(
  sourceText: string,
  fileNames: readonly string[] = [],
): string | null {
  const fromFiles = collectFromFilenames(fileNames);
  if (fromFiles[0]) return fromFiles[0];

  // Requisición # (XPU HA y similares) — aceptar 4–12 dígitos del rótulo explícito.
  const fromReq = collectFromRequisicionLabels(sourceText);
  if (fromReq.length > 0) {
    const counts = new Map<string, number>();
    for (const v of fromReq) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || b[0].length - a[0].length,
    );
    if (ranked[0]?.[0]) return ranked[0][0];
  }

  const fromLabels = collectFromLabels(sourceText);
  if (fromLabels.length > 0) {
    const counts = new Map<string, number>();
    for (const v of fromLabels) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || b[0].length - a[0].length,
    );
    const best = ranked[0]?.[0];
    if (best && looksLikeOcCode(best)) return best;
  }

  const frequent = collectFrequentNumericOcs(sourceText);
  const top = frequent[0];
  // Tabla Xcaret: la Oc Generada se repite en casi todas las filas.
  if (top && top.count >= 3 && looksLikeOcCode(top.value)) {
    return top.value;
  }

  return null;
}

function distinctAlmacenesForPedido(
  lineas: readonly LineaConPedido[],
  pedido: string,
): number {
  const set = new Set<string>();
  for (const l of lineas) {
    if ((l.numeroPedido ?? "").trim() !== pedido) continue;
    const a = (l.almacen ?? "").trim().toLowerCase();
    if (a) set.add(a);
  }
  return set.size;
}

/**
 * ¿Los numeroPedido de línea parecen IDs de Usuario y no la OC del documento?
 */
export function shouldUnifyNumeroPedidoToOc(
  lineas: readonly LineaConPedido[],
  ocCanonico: string,
): boolean {
  const oc = ocCanonico.trim();
  if (!oc) return false;

  const pedidos = lineas
    .map((l) => (l.numeroPedido ?? "").trim())
    .filter(Boolean);
  if (pedidos.length === 0) return true;

  const already = pedidos.filter((p) => p === oc).length;
  if (already === pedidos.length) return false;
  if (already >= Math.ceil(pedidos.length * 0.5)) return false;

  const distinct = new Set(pedidos);
  // Un solo pedido distinto y no es la OC → casi seguro mal mapeado.
  if (distinct.size === 1) {
    const only = [...distinct][0]!;
    return only !== oc && (looksLikeUsuarioId(only) || !looksLikeOcCode(only));
  }

  // Varios "pedidos" cortos, cada uno casi atado a un solo almacén (patrón Usuario).
  let spurious = 0;
  for (const p of distinct) {
    if (p === oc) continue;
    if (!looksLikeUsuarioId(p)) continue;
    if (distinctAlmacenesForPedido(lineas, p) <= 1) spurious += 1;
  }

  return spurious >= Math.max(2, Math.ceil(distinct.size * 0.5));
}

/**
 * Valor limpio para OCC / Numero pedido: descarta basura y, si hay texto fuente,
 * intenta REQUISICION # / Oc Generada.
 */
export function resolveOrdenCompraLimpia(
  raw: string | null | undefined,
  sourceText = "",
  fileNames: readonly string[] = [],
): string {
  const trimmed = (raw ?? "").trim();
  // Preferir siempre REQUISICIÓN # / Oc Generada del PDF si el raw parece Artículo.
  if (isGarbageOcValue(trimmed) || looksLikeArticuloSku(trimmed)) {
    const detected = detectOrdenCompraFromSource(sourceText, fileNames);
    if (detected) return detected;
    return "";
  }
  if (trimmed && looksLikeOcCode(trimmed)) {
    return trimmed;
  }
  if (trimmed && /^\d{4,20}$/.test(trimmed)) {
    // Requisición hotel (5 dígitos) u OC numérica válida (incl. PO SLS 16 dígitos).
    return trimmed;
  }
  const detected = detectOrdenCompraFromSource(sourceText, fileNames);
  if (detected) return detected;
  if (trimmed) return trimmed;
  return "";
}

/** Reescribe Numero pedido basura en renglones de origen_correo. */
export function sanitizeOrigenCorreoNumeroPedido<
  T extends { "Numero pedido"?: string },
>(rows: readonly T[], sourceText = ""): T[] {
  const detected = detectOrdenCompraFromSource(sourceText);
  return rows.map((row) => {
    const raw = row["Numero pedido"]?.trim() || "";
    if (!isGarbageOcValue(raw)) return row;
    return { ...row, "Numero pedido": detected || "" };
  });
}

export function normalizeNumeroPedidoFields<T extends LineaConPedido>(input: {
  ordenCompraHotel: string | null;
  lineas: T[];
  sourceText: string;
  fileNames?: readonly string[];
}): { ordenCompraHotel: string | null; lineas: T[] } {
  const detected = detectOrdenCompraFromSource(
    input.sourceText,
    input.fileNames ?? [],
  );

  const hotel = (input.ordenCompraHotel ?? "").trim() || null;
  let ocCanonico = detected;

  // Si no hubo señal en fuente, pero el hotel parece OC real y las líneas traen usuarios…
  if (!ocCanonico && hotel && looksLikeOcCode(hotel)) {
    ocCanonico = hotel;
  }

  // Si el hotel parece Usuario/basura (ej. rAutorizado) y detectamos OC/requisición, preferimos la detectada.
  if (
    detected &&
    hotel &&
    (looksLikeUsuarioId(hotel) || isGarbageOcValue(hotel)) &&
    detected !== hotel
  ) {
    ocCanonico = detected;
  }

  if (!ocCanonico) {
    return {
      ordenCompraHotel: hotel && !isGarbageOcValue(hotel) ? hotel : null,
      lineas: input.lineas.map((l) => ({ ...l })),
    };
  }

  if (!shouldUnifyNumeroPedidoToOc(input.lineas, ocCanonico)) {
    // Aun sin unificar líneas, corrige cabecera si era Usuario o basura OCR.
    const ordenCompraHotel =
      hotel &&
      (looksLikeUsuarioId(hotel) || isGarbageOcValue(hotel)) &&
      detected
        ? detected
        : hotel && !isGarbageOcValue(hotel)
          ? hotel
          : detected;
    return {
      ordenCompraHotel,
      lineas: input.lineas.map((l) => {
        const prev = (l.numeroPedido ?? "").trim();
        if (isGarbageOcValue(prev)) {
          return { ...l, numeroPedido: ordenCompraHotel };
        }
        return { ...l };
      }),
    };
  }

  return {
    ordenCompraHotel: ocCanonico,
    lineas: input.lineas.map((l) => {
      const prev = (l.numeroPedido ?? "").trim();
      const prevAlmacen = (l.numeroAlmacen ?? "").trim();
      const moveUsuario =
        !prevAlmacen &&
        Boolean(prev) &&
        prev !== ocCanonico &&
        looksLikeUsuarioId(prev);
      return {
        ...l,
        numeroPedido: ocCanonico,
        ...(moveUsuario ? { numeroAlmacen: prev } : {}),
      };
    }),
  };
}
