function normalizeQtyKey(cantidad: number): string {
  if (!Number.isFinite(cantidad)) return "";
  const rounded = Math.round(cantidad * 1000) / 1000;
  return String(rounded);
}

/** Clave de nota de línea: preferir idProducto (estable) + OT; nombre/qty como legado. */
export function formatNotaLineaKey(input: {
  nombre: string;
  cantidad: number;
  otId?: string | null;
  idProducto?: string | null;
}): string {
  const nombre = input.nombre.trim();
  const qty = normalizeQtyKey(input.cantidad);
  const ot = input.otId?.trim() || "";
  const id = input.idProducto?.trim() || "";
  // REQ-138: clave por id de producto para que la especificación sobreviva al reabrir.
  if (id && ot) return `ot:${ot}|pid:${id}`;
  if (id) return `pid:${id}`;
  if (ot && qty) return `ot:${ot}|${nombre}|${qty}`;
  if (ot) return `ot:${ot}|${nombre}`;
  if (qty) return `${nombre}|${qty}`;
  return nombre;
}

export function notaCapturaForProducto(
  notasLineas: string,
  productoNombre: string,
): string {
  return notaCapturaForLinea(notasLineas, {
    nombre: productoNombre,
    allowUnscoped: true,
  });
}

/**
 * Lee la especificación de una línea.
 * Prioridad: ot+nombre+qty → ot+nombre → nombre+qty → (opcional) nombre solo.
 * El formato legado `PRODUCTO: nota` no se aplica a otra OT si hay contexto otId.
 */
export function notaCapturaForLinea(
  notasLineas: string,
  input: {
    nombre: string;
    cantidad?: number;
    otId?: string | null;
    idProducto?: string | null;
    /** Solo para vistas sin OT (o compat). Con otId suele ir false. */
    allowUnscoped?: boolean;
  },
): string {
  const nombre = input.nombre.trim();
  if (!notasLineas.trim()) return "";
  if (!nombre && !input.idProducto?.trim()) return "";

  const qty =
    input.cantidad != null && Number.isFinite(input.cantidad)
      ? normalizeQtyKey(input.cantidad)
      : "";
  const ot = input.otId?.trim() || "";
  const id = input.idProducto?.trim() || "";
  const allowUnscoped = input.allowUnscoped === true && !ot;

  const candidates: string[] = [];
  if (id && ot) candidates.push(`ot:${ot}|pid:${id}: `);
  if (id) candidates.push(`pid:${id}: `);
  if (nombre && ot && qty) candidates.push(`ot:${ot}|${nombre}|${qty}: `);
  if (nombre && ot) candidates.push(`ot:${ot}|${nombre}: `);
  if (nombre && qty) candidates.push(`${nombre}|${qty}: `);
  if (allowUnscoped && nombre) candidates.push(`${nombre}: `);

  for (const prefix of candidates) {
    for (const line of notasLineas.split("\n")) {
      if (line.startsWith(prefix)) {
        return stripSurtidoMetaFromEspecificacion(
          line.slice(prefix.length).trim(),
        );
      }
    }
  }
  return "";
}

export function buildNotasLineasText(
  lineas: readonly {
    nombre: string;
    cantidad: number;
    otId?: string | null;
    idProducto?: string | null;
    especificacion: string;
    ivaPct?: string | null;
  }[],
): string {
  return lineas
    .flatMap((linea) => {
      const bits: string[] = [];
      if (linea.especificacion.trim()) {
        bits.push(linea.especificacion.trim());
      }
      if (linea.ivaPct && linea.ivaPct !== "0") {
        bits.push(`IVA ${linea.ivaPct}%`);
      }
      if (bits.length === 0) return [];
      const key = formatNotaLineaKey({
        nombre: linea.nombre,
        cantidad: linea.cantidad,
        otId: linea.otId,
        idProducto: linea.idProducto,
      });
      return [`${key}: ${bits.join(" · ")}`];
    })
    .join("\n");
}

/** Quita prep/inc que no pertenecen a la columna Especificación del PDF. */
export function stripSurtidoMetaFromEspecificacion(raw: string): string {
  return raw
    .replace(/\s*·\s*prep\s+[^·]+/gi, "")
    .replace(/\s*·\s*inc\s+[A-Za-z0-9]+/gi, "")
    .replace(/\s*·\s*$/g, "")
    .trim();
}

/**
 * Quita el bloque que el sync de surtido (foto QR) appendea a `notas_almacen`.
 * Ese bloque no es “Notas generales” del pedido.
 */
export function stripSurtidoFotoQrFromNotas(raw: string): string {
  return raw
    .replace(/(?:\n\n+)?Surtido\s*\(\s*foto\s*qr\s*\)\s*:[\s\S]*$/i, "")
    .trim();
}

export function todayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function tomorrowIsoDate(now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  return todayIsoDate(date);
}

export function isAfterWarehouseCutoff(now = new Date()): boolean {
  const hour = now.getHours();
  return hour >= 17 || hour < 2;
}
