import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  requireIdBodega,
  runDomainQuery,
  type TenantListParams,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
import { listTareasColaApi } from "@/modules/operations";
import {
  listUbicacionesEstadoBodega,
} from "@/modules/warehouses/estado-bodega/services/estado-bodega.service";
import {
  listAlmacenamientoVentaUbicacionIds,
} from "@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-ubicaciones";
import { listSolicitudesProcesamientoApi } from "./processing-api.service";
import type {
  ProductoProcesamientoOption,
  SolicitudProcesamientoOperadorRow,
  SolicitudProcesamientoRow,
  TareaColaRow,
} from "../types/processing.types";
import {
  PRODUCTO_PROC_COLUMNS,
  type ProductoProcesamientoDbRow,
  fetchProductoLabels,
  mapProductoOption,
  mapSolicitudOperadorRow,
} from "./processing.service.shared";

function exigirScopeListado(params: TenantListParams): {
  codigoCuenta: string;
  idBodega: string;
} {
  const codigoCuenta = params.codigoCuenta?.trim();
  const idBodega = params.idBodega?.trim();
  if (!codigoCuenta || !idBodega) {
    throw new DomainServiceError(
      "Selecciona cuenta y bodega para listar procesamiento.",
      "INVALID_ARGUMENT",
    );
  }
  return { codigoCuenta, idBodega };
}

export async function listSolicitudesProcesamiento(
  params: TenantListParams,
): Promise<SolicitudProcesamientoRow[]> {
  const { codigoCuenta, idBodega } = exigirScopeListado(params);
  return listSolicitudesProcesamientoApi({ codigoCuenta, idBodega });
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
  const { codigoCuenta, idBodega } = exigirScopeListado(params);
  return listTareasColaApi({ codigoCuenta, idBodega });
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
