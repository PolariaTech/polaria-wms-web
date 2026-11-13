/**
 * Tipos y parseo de origen_correo (renglón, hija, JSON persistido e id de OT).
 * La agrupación en hijas vive en origen-correo-ordenes-trabajo.ts.
 */

export interface OrigenCorreoRenglon {
  Fecha?: string;
  Unidad?: string;
  Almacen?: string;
  Horario?: string;
  Cantidad?: number | string;
  Producto?: string;
  /** Precio unitario del documento (si venía en el PDF/correo). */
  Precio?: number | string;
  "Numero correo"?: string;
  "Numero pedido"?: string;
  "Nombre cliente"?: string;
  "Numero almacen"?: string;
  "Codigo producto"?: string;
  "Referencia pedido"?: string;
  "Responsable externo"?: string;
  "Responsable interno"?: string;
  "Referencia del cliente"?: string;
  /** Ventana de entrega (hora desde), ej. "06:00". */
  "Ventana desde"?: string;
  /** Ventana de entrega (hora hasta), ej. "06:00". */
  "Ventana hasta"?: string;
  /** Dirección / destino de entrega. */
  "Direccion entrega"?: string;
  /** Destino corto (ej. Parque Xcaret) si no hay dirección completa. */
  Destino?: string;
  /** Andén / punto de recepción. */
  Anden?: string;
  /** Teléfono del contacto de entrega. */
  "Telefono contacto"?: string;
  /** Correo del contacto de entrega. */
  "Correo contacto"?: string;
  /** Prioridad del pedido (Normal / Urgente). */
  Prioridad?: string;
  /** REQ-287: lo que el cliente pide del producto (sin penacho, limpio, en bote…), como lo leyó Mateo. */
  Especificacion?: string;
  /** Notas generales / instrucciones de entrega. */
  "Notas generales"?: string;
  /** Índice en el array original / vínculo con línea del formulario. */
  _lineaIndex?: number;
  /**
   * Id estable de orden de trabajo (manual o preservado tras editar).
   * Si está presente, agrupa por este valor en vez de pedido+almacén.
   */
  _otId?: string;
  /**
   * REQ-201: producto de catálogo ya verificado al guardar avance (sin confirmar).
   * Al reabrir se restaura sin volver a pedir verificación.
   */
  _idProducto?: string;
}

export interface OrdenTrabajoHija {
  id: string;
  label: string;
  numeroPedido: string;
  almacen: string;
  referenciaPedido: string;
  fecha: string;
  responsableExterno: string;
  renglones: OrigenCorreoRenglon[];
  totalCantidad: number;
}

export function isOrigenCorreoArray(value: unknown): value is OrigenCorreoRenglon[] {
  return Array.isArray(value);
}

export function parseOrigenCorreoJson(
  value: unknown,
): OrigenCorreoRenglon[] {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return isOrigenCorreoArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return isOrigenCorreoArray(value) ? value : [];
}

/** Normaliza la clave OT usada en QR / captura. */
export function normalizeIdOrdenTrabajo(
  value: string | null | undefined,
): string {
  return (value ?? "").trim();
}

/**
 * Parsea la clave `pedido:…|almacen:…` (o `ref:…`) a campos legibles.
 * El almacén de la clave es el centro de consumo de la OT.
 */
export function parseIdOrdenTrabajoFields(idOrdenTrabajo: string): {
  numeroPedido: string;
  centroConsumo: string;
  label: string;
} {
  const raw = normalizeIdOrdenTrabajo(idOrdenTrabajo);
  if (!raw) {
    return {
      numeroPedido: "",
      centroConsumo: "",
      label: "Hoja (sin OT)",
    };
  }

  const pedidoMatch = raw.match(/pedido:([^|]+)/i);
  const almacenMatch = raw.match(/almacen:([^|]+)/i);
  const refMatch = raw.match(/ref:([^|]+)/i);

  const numeroPedido = (pedidoMatch?.[1] ?? "").trim();
  const centroConsumo = (almacenMatch?.[1] ?? "").trim();
  const referencia = (refMatch?.[1] ?? "").trim();

  const pedido =
    numeroPedido && numeroPedido !== "_" ? numeroPedido : "";
  const centro =
    centroConsumo && centroConsumo !== "_" ? centroConsumo : "";

  if (pedido && centro) {
    return {
      numeroPedido: pedido,
      centroConsumo: centro,
      label: `${pedido} — ${centro}`,
    };
  }
  if (centro) {
    return { numeroPedido: pedido, centroConsumo: centro, label: centro };
  }
  if (pedido) {
    return { numeroPedido: pedido, centroConsumo: "", label: pedido };
  }
  if (referencia && referencia !== "_") {
    return {
      numeroPedido: "",
      centroConsumo: "",
      label: referencia,
    };
  }
  return { numeroPedido: "", centroConsumo: "", label: raw };
}
