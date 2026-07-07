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
import type {
  CreateSolicitudProcesamientoInput,
  ProductoProcesamientoOption,
  SolicitudProcesamientoOperadorRow,
  SolicitudProcesamientoRow,
  TareaColaRow,
} from "../types/processing.types";

const SOLICITUD_PROC_COLUMNS =
  "id_solicitud_procesamiento,codigo_cuenta,id_bodega,codigo,id_cliente,id_producto_primario,id_producto_secundario,id_solicitante,id_procesador,estado,kilos_primario,kilos_secundario,kilos_merma,regla_conversion_cantidad_primario,regla_conversion_unidades_secundario,estimado_unidades_secundario,created_at,updated_at";

const TAREA_COLA_COLUMNS =
  "id_tarea,codigo_cuenta,id_bodega,tipo,estado,id_asignado,id_orden_trabajo,titulo,descripcion,created_at,updated_at";

const PRODUCTO_PROC_COLUMNS =
  "id_producto,descripcion,sku,regla_conversion_cantidad_primario,regla_conversion_unidades_secundario,id_producto_primario";

interface ProductoProcesamientoDbRow {
  id_producto: string;
  descripcion: string;
  sku: string;
  regla_conversion_cantidad_primario: string | null;
  regla_conversion_unidades_secundario: string | null;
  id_producto_primario: string | null;
}

interface WarehouseStockDbRow {
  id_producto: string;
  cantidad: string;
}

function resolveProductoLabel(row: ProductoProcesamientoDbRow): string {
  const titulo = row.descripcion.trim();
  return titulo ? `${titulo} (${row.sku})` : row.sku;
}

function parseDecimal(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function mapProductoOption(row: ProductoProcesamientoDbRow): ProductoProcesamientoOption {
  return {
    idProducto: row.id_producto,
    label: resolveProductoLabel(row),
    reglaConversionCantidadPrimario: parseDecimal(
      row.regla_conversion_cantidad_primario,
    ),
    reglaConversionUnidadesSecundario: parseDecimal(
      row.regla_conversion_unidades_secundario,
    ),
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

// TODO POL-5+: cerrar solicitudes de procesamiento vía apiRequest al API Nest.

export async function listSolicitudesProcesamiento(
  params: TenantListParams,
): Promise<SolicitudProcesamientoRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("solicitud_procesamiento").select(SOLICITUD_PROC_COLUMNS),
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
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("tarea_cola").select(TAREA_COLA_COLUMNS),
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
      .eq("es_secundario", true)
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

export async function getStockProductoBodega(
  idBodega: string,
  idProducto: string,
  codigoCuenta?: string,
): Promise<number> {
  const bodegaId = requireIdBodega(idBodega);
  const productoId = idProducto.trim();

  if (!productoId) return 0;

  const rows = await runDomainQuery<WarehouseStockDbRow[]>((client) => {
    let query = client
      .from("warehouse_state")
      .select("id_producto,cantidad")
      .eq("id_bodega", bodegaId)
      .eq("id_producto", productoId);

    if (codigoCuenta) {
      query = query.eq("codigo_cuenta", codigoCuenta);
    }

    return query as unknown as Promise<{
      data: WarehouseStockDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.reduce((total, row) => {
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
      .select(SOLICITUD_PROC_COLUMNS)
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
