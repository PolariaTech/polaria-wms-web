import { runDomainQuery } from "@/lib/supabase/domain-query";
import { parseCatalogoMetadatos } from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import type {
  ProductoProcesamientoOption,
  SolicitudProcesamientoOperadorRow,
  SolicitudProcesamientoRow,
} from "../types/processing.types";

export const SOLICITUD_PROC_COLUMNS_API =
  "id_solicitud_procesamiento,codigo_cuenta,id_bodega,codigo,id_cliente,id_producto_primario,id_producto_secundario,id_solicitante,id_operario,id_procesador,estado,kilos_primario,kilos_secundario,kilos_merma,sobrante_kg,regla_conversion_cantidad_primario,regla_conversion_unidades_secundario,perdida_procesamiento_pct,estimado_unidades_secundario,created_at,updated_at";

/** Lectura directa Supabase cuando el API Nest no está disponible. */
export const SOLICITUD_PROC_COLUMNS_SUPABASE = SOLICITUD_PROC_COLUMNS_API;

const TAREA_COLA_COLUMNS_API =
  "id_tarea,codigo_cuenta,id_bodega,tipo,estado,id_asignado,id_orden_trabajo,id_solicitud_procesamiento,titulo,descripcion,created_at,updated_at";

export const TAREA_COLA_COLUMNS_SUPABASE = TAREA_COLA_COLUMNS_API;

export const PRODUCTO_PROC_COLUMNS =
  "id_producto,descripcion,sku,regla_conversion_cantidad_primario,regla_conversion_unidades_secundario,id_producto_primario,merma_pct,metadatos_catalogo";

export interface ProductoProcesamientoDbRow {
  id_producto: string;
  descripcion: string;
  sku: string;
  regla_conversion_cantidad_primario: string | number | null;
  regla_conversion_unidades_secundario: string | number | null;
  id_producto_primario: string | null;
  merma_pct: string | number | null;
  metadatos_catalogo?: unknown;
}

function resolveProductoLabel(row: ProductoProcesamientoDbRow): string {
  const titulo = row.descripcion.trim();
  return titulo ? `${titulo} (${row.sku})` : row.sku;
}

export function parseDecimal(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  const trimmed = value.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function resolveMermaPct(row: ProductoProcesamientoDbRow): number | null {
  const fromColumn = parseDecimal(row.merma_pct);
  if (fromColumn !== null && fromColumn >= 0) return Math.min(100, fromColumn);

  const meta = parseCatalogoMetadatos(row.metadatos_catalogo);
  const fromMeta = parseDecimal(meta.mermaPct ?? null);
  if (fromMeta !== null && fromMeta >= 0) return Math.min(100, fromMeta);

  return null;
}

export function mapProductoOption(row: ProductoProcesamientoDbRow): ProductoProcesamientoOption {
  return {
    idProducto: row.id_producto,
    label: resolveProductoLabel(row),
    descripcion: row.descripcion.trim(),
    sku: row.sku,
    reglaConversionCantidadPrimario: parseDecimal(
      row.regla_conversion_cantidad_primario,
    ),
    reglaConversionUnidadesSecundario: parseDecimal(
      row.regla_conversion_unidades_secundario,
    ),
    mermaPct: resolveMermaPct(row),
  };
}

export async function fetchProductoLabels(
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();

  const uniqueIds = [...new Set(ids)];
  const rows = await runDomainQuery<ProductoProcesamientoDbRow[]>((client) => {
    const query = client
      .from("producto")
      .select(PRODUCTO_PROC_COLUMNS)
      .in("id_producto", uniqueIds)
      .limit(uniqueIds.length);

    return query as unknown as Promise<{
      data: ProductoProcesamientoDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return new Map(rows.map((row) => [row.id_producto, resolveProductoLabel(row)]));
}

export function generateProcesamientoCodigo(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `OP-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export function mapSolicitudOperadorRow(
  row: SolicitudProcesamientoRow,
  productLabels: Map<string, string>,
): SolicitudProcesamientoOperadorRow {
  return {
    idSolicitudProcesamiento: row.id_solicitud_procesamiento,
    orden: row.codigo,
    primario: productLabels.get(row.id_producto_primario) ?? "—",
    secundario: productLabels.get(row.id_producto_secundario) ?? "—",
    insumoPrimario: row.kilos_primario,
    estimSecundario: row.estimado_unidades_secundario ?? "—",
    estado: row.estado,
    fecha: row.created_at,
  };
}
