import {
  applyTenantFilters,
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { ESTADOS_VIAJE_EN_CURSO } from "../constants/viaje-status";
import type {
  EstadoViajeTransporte,
  EvidenciaTransporteRow,
  GuiaEnvioRow,
  TransportListParams,
  ViajeEntregaRow,
} from "../types/transport.types";

const GUIA_COLUMNS =
  "id_guia,codigo_cuenta,id_viaje,id_orden_venta,codigo,destino,estado,created_at,updated_at";

const EVIDENCIA_COLUMNS =
  "id_evidencia,id_guia,id_linea_orden_venta,tipo,url_cloudinary,cantidad_entregada,incidencia,entrega_conforme,created_at";

const VIAJE_COLUMNS =
  "id_viaje,codigo_cuenta,id_bodega,codigo,estado,id_transportista,created_at";

interface ViajeDbRow {
  id_viaje: string;
  codigo_cuenta: string;
  id_bodega: string;
  codigo: string;
  estado: EstadoViajeTransporte;
  id_transportista: string | null;
  created_at: string;
}

interface GuiaDbRow {
  id_guia: string;
  id_viaje: string;
  id_orden_venta: string | null;
  codigo: string;
}

interface OrdenVentaKgDbRow {
  id_orden_venta: string;
  codigo: string;
  id_comprador: string | null;
  comprador: { nombre: string } | { nombre: string }[] | null;
  orden_venta_linea:
    | { cantidad_pedida: number | string | null }[]
    | null;
}

// Crear viaje/guía: POST /transporte/paquetes-despacho (crearPaqueteDespachoApi).
// Cerrar entrega: POST /transporte/entregas (registrarEntregaApi) + /api/evidencia-transporte.

function sumCantidadPedida(
  lineas: OrdenVentaKgDbRow["orden_venta_linea"],
): number {
  if (!lineas?.length) return 0;
  return lineas.reduce((acc, linea) => {
    const raw = Number(linea.cantidad_pedida);
    return acc + (Number.isFinite(raw) ? raw : 0);
  }, 0);
}

function resolveCompradorNombre(
  comprador: OrdenVentaKgDbRow["comprador"],
): string {
  if (!comprador) return "—";
  const row = Array.isArray(comprador) ? comprador[0] : comprador;
  return row?.nombre?.trim() || "—";
}

export async function listGuiasEnvio(
  params: TransportListParams,
): Promise<GuiaEnvioRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  return runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("guia_envio").select(GUIA_COLUMNS),
      params,
    )
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: GuiaEnvioRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function listEvidenciasTransporte(
  params: TransportListParams,
): Promise<EvidenciaTransporteRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  requireCodigoCuenta(params.codigoCuenta);

  return runDomainQuery((client) => {
    let query = client
      .from("evidencia_transporte")
      .select(EVIDENCIA_COLUMNS);

    if (params.idGuia) {
      query = query.eq("id_guia", params.idGuia);
    }

    return query
      .order("created_at", { ascending: false })
      .limit(limit) as unknown as Promise<{
      data: EvidenciaTransporteRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

/** Lista viajes en curso enriquecidos con venta / cliente / kg (tabla transportista). */
export async function listViajesEntrega(
  params: TransportListParams,
): Promise<ViajeEntregaRow[]> {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  requireCodigoCuenta(params.codigoCuenta);

  const viajes = await runDomainQuery((client) => {
    const query = applyTenantFilters(
      client.from("viaje_transporte").select(VIAJE_COLUMNS),
      params,
    )
      .in("estado", [...ESTADOS_VIAJE_EN_CURSO])
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: ViajeDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  if (viajes.length === 0) return [];

  const viajeIds = viajes.map((viaje) => viaje.id_viaje);
  const viajeById = new Map(viajes.map((viaje) => [viaje.id_viaje, viaje]));

  const guias = await runDomainQuery((client) => {
    return client
      .from("guia_envio")
      .select("id_guia,id_viaje,id_orden_venta,codigo")
      .in("id_viaje", viajeIds)
      .order("created_at", { ascending: false })
      .limit(DEFAULT_LIST_LIMIT) as unknown as Promise<{
      data: GuiaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  const ordenIds = [
    ...new Set(
      guias
        .map((guia) => guia.id_orden_venta?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const ordenById = new Map<
    string,
    { codigo: string; clienteNombre: string; kgVenta: number }
  >();

  if (ordenIds.length > 0) {
    const ordenes = await runDomainQuery((client) => {
      return client
        .from("orden_venta")
        .select(
          "id_orden_venta,codigo,id_comprador,comprador(nombre),orden_venta_linea(cantidad_pedida)",
        )
        .in("id_orden_venta", ordenIds)
        .limit(DEFAULT_LIST_LIMIT) as unknown as Promise<{
        data: OrdenVentaKgDbRow[] | null;
        error: { message: string } | null;
      }>;
    });

    for (const orden of ordenes) {
      ordenById.set(orden.id_orden_venta, {
        codigo: orden.codigo,
        clienteNombre: resolveCompradorNombre(orden.comprador),
        kgVenta: sumCantidadPedida(orden.orden_venta_linea),
      });
    }
  }

  const rows: ViajeEntregaRow[] = [];
  const coveredViajes = new Set<string>();

  for (const guia of guias) {
    const viaje = viajeById.get(guia.id_viaje);
    if (!viaje) continue;
    coveredViajes.add(viaje.id_viaje);

    const orden = guia.id_orden_venta
      ? ordenById.get(guia.id_orden_venta)
      : undefined;

    rows.push({
      idViaje: viaje.id_viaje,
      codigoViaje: viaje.codigo,
      idGuia: guia.id_guia,
      idOrdenVenta: guia.id_orden_venta,
      codigoVenta: orden?.codigo ?? "—",
      clienteNombre: orden?.clienteNombre ?? "—",
      kgVenta: orden?.kgVenta ?? 0,
      estado: viaje.estado,
    });
  }

  for (const viaje of viajes) {
    if (coveredViajes.has(viaje.id_viaje)) continue;
    rows.push({
      idViaje: viaje.id_viaje,
      codigoViaje: viaje.codigo,
      idGuia: null,
      idOrdenVenta: null,
      codigoVenta: "—",
      clienteNombre: "—",
      kgVenta: 0,
      estado: viaje.estado,
    });
  }

  return rows;
}
