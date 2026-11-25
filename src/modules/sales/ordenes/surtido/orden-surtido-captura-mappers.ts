import { normalizeIdOrdenTrabajo } from "../utils/origen/origen-correo-ordenes-trabajo";
import type {
  OrdenSurtidoCapturaFotoRow,
  OrdenSurtidoCapturaPayload,
  OrdenSurtidoCapturaRow,
} from "./orden-surtido.types";

export interface CapturaDbRow {
  id_captura: string;
  id_orden_venta: string;
  id_orden_trabajo?: string | null;
  codigo_cuenta: string;
  url_foto: string | null;
  payload: OrdenSurtidoCapturaPayload | null;
  modelo: string | null;
  updated_at: string;
}

export interface CapturaFotoDbRow {
  id_foto: string;
  id_orden_venta: string;
  id_orden_trabajo?: string | null;
  codigo_cuenta: string;
  url_foto: string;
  created_at: string;
}

export const CAPTURA_SELECT =
  "id_captura,id_orden_venta,id_orden_trabajo,codigo_cuenta,url_foto,payload,modelo,updated_at";

export const FOTO_SELECT =
  "id_foto,id_orden_venta,id_orden_trabajo,codigo_cuenta,url_foto,created_at";

export function coercePayload(
  raw: OrdenSurtidoCapturaPayload | null | undefined,
): OrdenSurtidoCapturaPayload {
  return {
    campos: raw?.campos ?? {},
    checks: raw?.checks ?? {},
    lineas: Array.isArray(raw?.lineas) ? raw.lineas : [],
    observacionesIa: raw?.observacionesIa ?? null,
  };
}

export function mapRow(row: CapturaDbRow): OrdenSurtidoCapturaRow {
  return {
    idCaptura: row.id_captura,
    idOrdenVenta: row.id_orden_venta,
    idOrdenTrabajo: normalizeIdOrdenTrabajo(row.id_orden_trabajo),
    codigoCuenta: row.codigo_cuenta,
    urlFoto: row.url_foto,
    payload: coercePayload(row.payload),
    modelo: row.modelo,
    updatedAt: row.updated_at,
  };
}

export function mapFotoRow(row: CapturaFotoDbRow): OrdenSurtidoCapturaFotoRow {
  return {
    idFoto: row.id_foto,
    idOrdenVenta: row.id_orden_venta,
    idOrdenTrabajo: normalizeIdOrdenTrabajo(row.id_orden_trabajo),
    codigoCuenta: row.codigo_cuenta,
    urlFoto: row.url_foto,
    createdAt: row.created_at,
  };
}

export function resolveTituloProducto(producto: unknown): string {
  if (!producto || typeof producto !== "object") return "Producto";
  const row = Array.isArray(producto) ? producto[0] : producto;
  if (!row || typeof row !== "object") return "Producto";
  const data = row as {
    descripcion?: string | null;
    sku?: string | null;
    metadatos_catalogo?: { titulo?: string } | null;
  };
  const titulo = data.metadatos_catalogo?.titulo?.trim();
  if (titulo) return titulo;
  return data.descripcion?.trim() || data.sku?.trim() || "Producto";
}