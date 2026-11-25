import { runDomainQuery } from "@/lib/supabase/domain-query";
import {
  aplicarOrdenProcesamientoApi,
  asignarOperarioProcesamientoApi,
  asignarProcesadorApi,
  cerrarSolicitudProcesamientoApi,
  crearOrdenesPostCierreApi,
  getDesperdicioSugeridoApi,
  getSolicitudProcesamientoApi,
  iniciarProcesamientoApi,
  terminarSolicitudProcesamientoApi,
} from "./processing-api.service";
import type {
  CreateOrdenesPostCierreInput,
  OrdenesPostCierreResult,
  SolicitudProcesamientoRow,
} from "../types/processing.types";
import { buildDesperdicioSugeridoDetalle } from "../utils/desperdicio-kg-sugerido";
import type { DesperdicioSugeridoDetalle } from "../utils/desperdicio-kg-sugerido";
import {
  PRODUCTO_PROC_COLUMNS,
  type ProductoProcesamientoDbRow,
  fetchProductoLabels,
  parseDecimal,
  resolveMermaPct,
} from "./processing.service.shared";

// Flujo frio: mutaciones vía API Nest (sin cambios de UI).

export async function getSolicitudProcesamiento(
  idSolicitud: string,
): Promise<SolicitudProcesamientoRow> {
  return getSolicitudProcesamientoApi(idSolicitud);
}

export async function getDesperdicioSugerido(
  idSolicitud: string,
): Promise<number | null> {
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
  const api = await getDesperdicioSugeridoApi(idSolicitud);
  const solicitud = await getSolicitudProcesamiento(idSolicitud);
  const perdidaPct = await resolvePerdidaPctSolicitud(solicitud);

  if (
    api.desperdicioKgSugerido !== null &&
    Number.isFinite(api.desperdicioKgSugerido)
  ) {
    return {
      desperdicioKg: api.desperdicioKgSugerido,
      perdidaPct,
      kilosPrimario: parseDecimal(solicitud.kilos_primario),
    };
  }

  return buildDesperdicioSugeridoDetalle({
    kilosPrimario: solicitud.kilos_primario,
    perdidaProcesamientoPct: perdidaPct,
  });
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

export async function fetchProductoLabelsProcesamiento(
  ids: string[],
): Promise<Map<string, string>> {
  return fetchProductoLabels(ids);
}
