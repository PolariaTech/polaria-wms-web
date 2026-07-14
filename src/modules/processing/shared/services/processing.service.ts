import {
  applyTenantFilters,
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  requireIdBodega,
  runDomainMutation,
  runDomainQuery,
  type TenantListParams,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { parseCatalogoMetadatos } from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
import { listTareasColaApi } from "@/modules/operations";
import { listUbicacionesEstadoBodega } from "@/modules/warehouses/estado-bodega/services/estado-bodega.service";
import { listAlmacenamientoVentaUbicacionIds } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-ubicaciones";
import {
  aplicarOrdenProcesamientoApi,
  asignarOperarioProcesamientoApi,
  asignarProcesadorApi,
  cerrarSolicitudProcesamientoApi,
  crearOrdenesPostCierreApi,
  createSolicitudProcesamientoApi,
  getDesperdicioSugeridoApi,
  getSolicitudProcesamientoApi,
  iniciarProcesamientoApi,
  listSolicitudesProcesamientoApi,
  terminarSolicitudProcesamientoApi,
} from "./processing-api.service";
import type {
  CreateOrdenesPostCierreInput,
  CreateSolicitudProcesamientoInput,
  OrdenesPostCierreResult,
  ProductoProcesamientoOption,
  SolicitudProcesamientoOperadorRow,
  SolicitudProcesamientoRow,
  TareaColaRow,
} from "../types/processing.types";
import {
  buildDesperdicioSugeridoDetalle,
} from "../utils/desperdicio-kg-sugerido";
import type { DesperdicioSugeridoDetalle } from "../utils/desperdicio-kg-sugerido";

const SOLICITUD_PROC_COLUMNS_API =
  "id_solicitud_procesamiento,codigo_cuenta,id_bodega,codigo,id_cliente,id_producto_primario,id_producto_secundario,id_solicitante,id_operario,id_procesador,estado,kilos_primario,kilos_secundario,kilos_merma,sobrante_kg,regla_conversion_cantidad_primario,regla_conversion_unidades_secundario,perdida_procesamiento_pct,estimado_unidades_secundario,created_at,updated_at";

/** Lectura directa Supabase cuando el API Nest no está disponible. */
const SOLICITUD_PROC_COLUMNS_SUPABASE = SOLICITUD_PROC_COLUMNS_API;

const TAREA_COLA_COLUMNS_API =
  "id_tarea,codigo_cuenta,id_bodega,tipo,estado,id_asignado,id_orden_trabajo,id_solicitud_procesamiento,titulo,descripcion,created_at,updated_at";

const TAREA_COLA_COLUMNS_SUPABASE = TAREA_COLA_COLUMNS_API;

const PRODUCTO_PROC_COLUMNS =
  "id_producto,descripcion,sku,regla_conversion_cantidad_primario,regla_conversion_unidades_secundario,id_producto_primario,merma_pct,metadatos_catalogo";

interface ProductoProcesamientoDbRow {
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

function parseDecimal(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  const trimmed = value.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function resolveMermaPct(row: ProductoProcesamientoDbRow): number | null {
  const fromColumn = parseDecimal(row.merma_pct);
  if (fromColumn !== null && fromColumn >= 0) return Math.min(100, fromColumn);

  const meta = parseCatalogoMetadatos(row.metadatos_catalogo);
  const fromMeta = parseDecimal(meta.mermaPct ?? null);
  if (fromMeta !== null && fromMeta >= 0) return Math.min(100, fromMeta);

  return null;
}

function mapProductoOption(row: ProductoProcesamientoDbRow): ProductoProcesamientoOption {
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

async function fetchProductoLabels(
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

function generateProcesamientoCodigo(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `OP-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function mapSolicitudOperadorRow(
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

// Flujo frio: mutaciones vía API Nest (sin cambios de UI).

export async function getSolicitudProcesamiento(
  idSolicitud: string,
): Promise<SolicitudProcesamientoRow> {
  return getSolicitudProcesamientoApi(idSolicitud);
}

export async function getDesperdicioSugerido(
  idSolicitud: string,
): Promise<number | null> {
<<<<<<< ours
  const detalle = await getDesperdicioSugeridoDetalle(idSolicitud);
  return detalle.desperdicioKg;
}

async function resolvePerdidaPctSolicitud(
  solicitud: SolicitudProcesamientoRow,
): Promise<number | null> {
  const fromSolicitud = parseDecimal(solicitud.perdida_procesamiento_pct);
  if (fromSolicitud !== null && fromSolicitud > 0) {
    return Math.min(100, fromSolicitud);
  }

  const idSecundario = solicitud.id_producto_secundario?.trim();
  if (!idSecundario) return null;

  const rows = await runDomainQuery<ProductoProcesamientoDbRow[]>((client) => {
    const query = client
      .from("producto")
      .select(PRODUCTO_PROC_COLUMNS)
      .eq("id_producto", idSecundario)
      .limit(1);

    return query as unknown as Promise<{
      data: ProductoProcesamientoDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  const producto = rows[0];
  if (!producto) return null;

  const fromProducto = resolveMermaPct(producto);
  return fromProducto !== null && fromProducto > 0 ? fromProducto : null;
}

/** Detalle de merma sugerida para UI del procesador (referencia frio). */
export async function getDesperdicioSugeridoDetalle(
  idSolicitud: string,
): Promise<DesperdicioSugeridoDetalle> {
  try {
    const api = await getDesperdicioSugeridoApi(idSolicitud);
    if (
      api.desperdicioKgSugerido !== null &&
      Number.isFinite(api.desperdicioKgSugerido)
    ) {
      const solicitud = await getSolicitudProcesamiento(idSolicitud);
      const perdidaPct = await resolvePerdidaPctSolicitud(solicitud);
      return {
        desperdicioKg: api.desperdicioKgSugerido,
        perdidaPct,
        kilosPrimario: parseDecimal(solicitud.kilos_primario),
      };
    }
  } catch {
    // fallback cliente
  }

  const solicitud = await getSolicitudProcesamiento(idSolicitud);
  const perdidaPct = await resolvePerdidaPctSolicitud(solicitud);

  return buildDesperdicioSugeridoDetalle({
    kilosPrimario: solicitud.kilos_primario,
    perdidaProcesamientoPct: perdidaPct,
  });
=======
  const result = await getDesperdicioSugeridoApi(idSolicitud);
  return result.desperdicioKgSugerido;
>>>>>>> theirs
}

export async function asignarOperarioProcesamiento(
  idSolicitud: string,
  params: { codigoCuenta: string; idBodega: string; idOperario: string },
): Promise<SolicitudProcesamientoRow> {
  return asignarOperarioProcesamientoApi(idSolicitud, params);
}

export async function iniciarProcesamiento(
  idSolicitud: string,
  params: { codigoCuenta: string; idBodega: string; idProcesador?: string },
): Promise<SolicitudProcesamientoRow> {
  return iniciarProcesamientoApi(idSolicitud, params);
}

export async function asignarProcesadorProcesamiento(
  idSolicitud: string,
  params: { codigoCuenta: string; idBodega: string; idProcesador: string },
): Promise<SolicitudProcesamientoRow> {
  return asignarProcesadorApi(idSolicitud, params);
}

export async function cerrarSolicitudProcesamiento(
  idSolicitud: string,
  params: {
    codigoCuenta: string;
    idBodega: string;
    kilosMerma: number;
    kilosSecundario?: number;
  },
): Promise<SolicitudProcesamientoRow> {
  return cerrarSolicitudProcesamientoApi(idSolicitud, params);
}

export async function crearOrdenesPostCierre(
  idSolicitud: string,
  input: CreateOrdenesPostCierreInput,
): Promise<OrdenesPostCierreResult> {
  return crearOrdenesPostCierreApi(idSolicitud, input);
}

export async function aplicarOrdenProcesamiento(
  idSolicitud: string,
  idOrden: string,
): Promise<{ ok: true }> {
  return aplicarOrdenProcesamientoApi(idSolicitud, idOrden);
}

export async function terminarSolicitudProcesamiento(
  idSolicitud: string,
  params: { codigoCuenta: string; idBodega: string },
): Promise<SolicitudProcesamientoRow> {
  return terminarSolicitudProcesamientoApi(idSolicitud, params);
}
<<<<<<< ours

export async function fetchProductoLabelsProcesamiento(
  ids: string[],
): Promise<Map<string, string>> {
  return fetchProductoLabels(ids);
}
=======
>>>>>>> theirs

export async function listSolicitudesProcesamiento(
  params: TenantListParams,
): Promise<SolicitudProcesamientoRow[]> {
  const codigoCuenta = params.codigoCuenta?.trim();
  const idBodega = params.idBodega?.trim();

  if (codigoCuenta && idBodega) {
    try {
      return await listSolicitudesProcesamientoApi({
        codigoCuenta,
        idBodega,
      });
    } catch {
      // fallback lectura Supabase
    }
  }

  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client
        .from("solicitud_procesamiento")
        .select(SOLICITUD_PROC_COLUMNS_SUPABASE),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: SolicitudProcesamientoRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function listSolicitudesProcesamientoOperador(
  params: TenantListParams,
): Promise<SolicitudProcesamientoOperadorRow[]> {
  const rows = await listSolicitudesProcesamiento(params);
  const productIds = rows.flatMap((row) => [
    row.id_producto_primario,
    row.id_producto_secundario,
  ]);
  const productLabels = await fetchProductoLabels(productIds);

  return rows.map((row) => mapSolicitudOperadorRow(row, productLabels));
}

export async function listTareasCola(
  params: TenantListParams,
): Promise<TareaColaRow[]> {
  const codigoCuenta = params.codigoCuenta?.trim();
  const idBodega = params.idBodega?.trim();

  if (codigoCuenta && idBodega) {
    return listTareasColaApi({ codigoCuenta, idBodega });
  }

  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("tarea_cola").select(TAREA_COLA_COLUMNS_SUPABASE),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: TareaColaRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function listProductosPrimariosProcesamiento(
  codigoCuenta: string,
): Promise<ProductoProcesamientoOption[]> {
  const cuenta = requireCodigoCuenta(codigoCuenta);

  const rows = await runDomainQuery<ProductoProcesamientoDbRow[]>((client) => {
    const query = client
      .from("producto")
      .select(PRODUCTO_PROC_COLUMNS)
      .eq("codigo_cuenta", cuenta)
      .eq("esta_activo", true)
      .eq("es_primario", true)
      .order("descripcion", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: ProductoProcesamientoDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapProductoOption);
}

export async function listProductosPrimariosConSecundarioProcesamiento(
  codigoCuenta: string,
): Promise<ProductoProcesamientoOption[]> {
  const cuenta = requireCodigoCuenta(codigoCuenta);

  const secundarioRows = await runDomainQuery<
    { id_producto_primario: string | null }[]
  >((client) => {
    const query = client
      .from("producto")
      .select("id_producto_primario")
      .eq("codigo_cuenta", cuenta)
      .eq("esta_activo", true)
      .eq("es_secundario", true)
      .not("id_producto_primario", "is", null)
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: { id_producto_primario: string | null }[] | null;
      error: { message: string } | null;
    }>;
  });

  const primarioIds = [
    ...new Set(
      secundarioRows
        .map((row) => row.id_producto_primario?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (primarioIds.length === 0) return [];

  const rows = await runDomainQuery<ProductoProcesamientoDbRow[]>((client) => {
    const query = client
      .from("producto")
      .select(PRODUCTO_PROC_COLUMNS)
      .eq("codigo_cuenta", cuenta)
      .eq("esta_activo", true)
      .eq("es_primario", true)
      .in("id_producto", primarioIds)
      .order("descripcion", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: ProductoProcesamientoDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapProductoOption);
}

export async function listProductosSecundariosProcesamiento(
  codigoCuenta: string,
  idProductoPrimario: string,
): Promise<ProductoProcesamientoOption[]> {
  const cuenta = requireCodigoCuenta(codigoCuenta);
  const idPrimario = idProductoPrimario.trim();

  if (!idPrimario) {
    throw new DomainServiceError(
      "Selecciona un producto primario válido.",
      "INVALID_ARGUMENT",
    );
  }

  const rows = await runDomainQuery<ProductoProcesamientoDbRow[]>((client) => {
    const query = client
      .from("producto")
      .select(PRODUCTO_PROC_COLUMNS)
      .eq("codigo_cuenta", cuenta)
      .eq("esta_activo", true)
      .eq("id_producto_primario", idPrimario)
      .order("descripcion", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: ProductoProcesamientoDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapProductoOption);
}

/** Stock procesable en el mapa: suma de almacenamiento (misma regla que el mapa de bodega). */
export async function getStockProductoBodega(
  idBodega: string,
  idProducto: string,
  codigoCuenta?: string,
): Promise<number> {
  const bodegaId = requireIdBodega(idBodega);
  const productoId = idProducto.trim();

  if (!productoId) return 0;

  const cuenta = codigoCuenta?.trim() || undefined;

  const [warehouseRows, ubicaciones] = await Promise.all([
    listWarehouseState({
      idBodega: bodegaId,
      codigoCuenta: cuenta,
      limit: 500,
    }),
    listUbicacionesEstadoBodega(bodegaId),
  ]);

  const almacenUbicacionIds = listAlmacenamientoVentaUbicacionIds(ubicaciones);

  return warehouseRows
    .filter(
      (row) =>
        row.id_producto === productoId &&
        almacenUbicacionIds.has(row.id_ubicacion),
    )
    .reduce((total, row) => {
      const cantidad = Number(row.cantidad);
      return total + (Number.isNaN(cantidad) ? 0 : cantidad);
    }, 0);
}

export async function createSolicitudProcesamiento(
  input: CreateSolicitudProcesamientoInput,
): Promise<SolicitudProcesamientoOperadorRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idBodega = requireIdBodega(input.idBodega);
  const idSolicitante = input.idSolicitante.trim();
  const idProductoPrimario = input.idProductoPrimario.trim();
  const idProductoSecundario = input.idProductoSecundario.trim();

  if (!idSolicitante) {
    throw new DomainServiceError(
      "No se encontró el usuario solicitante.",
      "INVALID_ARGUMENT",
    );
  }

  if (!idProductoPrimario || !idProductoSecundario) {
    throw new DomainServiceError(
      "Selecciona insumo y resultado válidos.",
      "INVALID_ARGUMENT",
    );
  }

  if (input.kilosPrimario <= 0) {
    throw new DomainServiceError(
      "Indica una cantidad a procesar mayor a cero.",
      "INVALID_ARGUMENT",
    );
  }

  if (input.reglaConversionUnidadesSecundario <= 0) {
    throw new DomainServiceError(
      "Indica una conversión válida.",
      "INVALID_ARGUMENT",
    );
  }

  const stock = await getStockProductoBodega(
    idBodega,
    idProductoPrimario,
    codigoCuenta,
  );

  if (stock <= 0) {
    throw new DomainServiceError(
      "Sin stock disponible en el mapa para el insumo seleccionado.",
      "INVALID_ARGUMENT",
    );
  }

  if (input.kilosPrimario > stock) {
    throw new DomainServiceError(
      "La cantidad a procesar supera el stock del mapa.",
      "INVALID_ARGUMENT",
    );
  }

  try {
    const row = await createSolicitudProcesamientoApi({
      codigoCuenta,
      idBodega,
      idSolicitante,
      idProductoPrimario,
      idProductoSecundario,
      kilosPrimario: input.kilosPrimario,
      reglaConversionCantidadPrimario: input.reglaConversionCantidadPrimario,
      reglaConversionUnidadesSecundario: input.reglaConversionUnidadesSecundario,
      estimadoUnidadesSecundario: input.estimadoUnidadesSecundario,
    });

    const productLabels = await fetchProductoLabels([
      row.id_producto_primario,
      row.id_producto_secundario,
    ]);

    return mapSolicitudOperadorRow(row, productLabels);
  } catch {
    // fallback Supabase si API no disponible
  }

  const row = await runDomainMutation<SolicitudProcesamientoRow>((client) => {
    const query = client
      .from("solicitud_procesamiento")
      .insert({
        codigo_cuenta: codigoCuenta,
        id_bodega: idBodega,
        codigo: generateProcesamientoCodigo(),
        id_producto_primario: idProductoPrimario,
        id_producto_secundario: idProductoSecundario,
        id_solicitante: idSolicitante,
        estado: "pendiente",
        kilos_primario: input.kilosPrimario,
        regla_conversion_cantidad_primario: input.reglaConversionCantidadPrimario,
        regla_conversion_unidades_secundario:
          input.reglaConversionUnidadesSecundario,
        estimado_unidades_secundario: input.estimadoUnidadesSecundario,
      })
      .select(SOLICITUD_PROC_COLUMNS_API)
      .single();

    return query as unknown as Promise<{
      data: SolicitudProcesamientoRow | null;
      error: { message: string } | null;
    }>;
  });

  const productLabels = await fetchProductoLabels([
    row.id_producto_primario,
    row.id_producto_secundario,
  ]);

  return mapSolicitudOperadorRow(row, productLabels);
}
