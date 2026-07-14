import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrdenTrabajoApiRow } from "@/modules/operations";
import { mapOrdenTrabajoApiRow } from "@/modules/operations/shared/utils/orden-trabajo-api.mapper";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import type { UbicacionEstadoBodegaDbRow } from "../types/estado-bodega.types";
import {
  collectDemoraAlertasOperativas,
  enrichTareasConOrden,
  filterTareasOvDuplicadas,
  isTareaPendienteOperativa,
  type DemoraAlertaOperativaDraft,
} from "../utils/estado-bodega-zone-operativo";
import {
  listAlmacenamientoVentaUbicacionIds,
  listIngresoUbicacionIds,
  listSalidaUbicacionIds,
} from "../utils/estado-bodega-zone-ubicaciones";

interface OrdenTrabajoDbRow {
  id_orden_trabajo: string;
  codigo_cuenta: string;
  id_bodega: string;
  codigo: string;
  estado: string;
  tipo: string;
  id_asignado: string | null;
  id_solicitante: string | null;
  id_lote: string | null;
  id_ubicacion_origen: string | null;
  id_ubicacion_destino: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

async function loadTareasPendientes(
  client: SupabaseClient,
  params: { codigoCuenta: string; idBodega: string },
): Promise<TareaColaRow[]> {
  const { data, error } = await client
    .from("tarea_cola")
    .select("*")
    .eq("codigo_cuenta", params.codigoCuenta)
    .eq("id_bodega", params.idBodega)
    .in("estado", ["pendiente", "en_proceso"]);

  if (error || !data) return [];
  return data as TareaColaRow[];
}

async function loadWarehouseState(
  client: SupabaseClient,
  params: { codigoCuenta: string; idBodega: string },
) {
  const { data, error } = await client
    .from("warehouse_state")
    .select("id_ubicacion,cantidad,cantidad_reservada")
    .eq("codigo_cuenta", params.codigoCuenta)
    .eq("id_bodega", params.idBodega)
    .limit(500);

  if (error || !data) return [];
  return data as Array<{
    id_ubicacion: string;
    cantidad: string | number;
    cantidad_reservada: string | number;
  }>;
}

async function loadOrdenesTrabajoForBodega(
  client: SupabaseClient,
  params: { codigoCuenta: string; idBodega: string },
): Promise<OrdenTrabajoApiRow[]> {
  const { data, error } = await client
    .from("orden_trabajo")
    .select(
      "id_orden_trabajo,codigo_cuenta,id_bodega,codigo,estado,tipo,id_asignado,id_solicitante,id_lote,id_ubicacion_origen,id_ubicacion_destino,observaciones,created_at,updated_at",
    )
    .eq("codigo_cuenta", params.codigoCuenta)
    .eq("id_bodega", params.idBodega)
    .limit(500);

  if (error || !data) return [];
  return (data as OrdenTrabajoDbRow[]).map((row) =>
    mapOrdenTrabajoApiRow(row as unknown as Record<string, unknown>),
  );
}

async function loadOrdenesTrabajo(
  client: SupabaseClient,
  ordenIds: string[],
): Promise<OrdenTrabajoApiRow[]> {
  if (ordenIds.length === 0) return [];

  const { data, error } = await client
    .from("orden_trabajo")
    .select(
      "id_orden_trabajo,codigo_cuenta,id_bodega,codigo,estado,tipo,id_asignado,id_solicitante,id_lote,id_ubicacion_origen,id_ubicacion_destino,observaciones,created_at,updated_at",
    )
    .in("id_orden_trabajo", ordenIds);

  if (error || !data) return [];
  return (data as OrdenTrabajoDbRow[]).map((row) =>
    mapOrdenTrabajoApiRow(row as unknown as Record<string, unknown>),
  );
}

async function loadUbicaciones(
  client: SupabaseClient,
  idBodega: string,
): Promise<UbicacionEstadoBodegaDbRow[]> {
  const { data, error } = await client
    .from("ubicacion")
    .select(
      "id_ubicacion,codigo,estado_slot,tipo_ubicacion(codigo,es_recepcion,es_almacenamiento,es_picking)",
    )
    .eq("id_bodega", idBodega);

  if (error || !data) return [];
  return data as UbicacionEstadoBodegaDbRow[];
}

async function demoraAlertaYaRegistrada(
  client: SupabaseClient,
  params: {
    codigoCuenta: string;
    idBodega: string;
    idTarea: string;
  },
): Promise<boolean> {
  const { data, error } = await client
    .from("alerta_operativa")
    .select("id_alerta")
    .eq("codigo_cuenta", params.codigoCuenta)
    .eq("id_bodega", params.idBodega)
    .eq("tipo", "demora")
    .contains("metadata", { id_tarea: params.idTarea })
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

async function persistDemoraAlerta(
  client: SupabaseClient,
  params: {
    codigoCuenta: string;
    idBodega: string;
  },
  draft: DemoraAlertaOperativaDraft,
): Promise<void> {
  const { error } = await client.from("alerta_operativa").insert({
    codigo_cuenta: params.codigoCuenta,
    id_bodega: params.idBodega,
    tipo: "demora",
    estado: "abierta",
    titulo: draft.titulo,
    descripcion: draft.descripcion,
    id_orden_trabajo: draft.idOrdenTrabajo,
    id_ubicacion: draft.idUbicacionOrigen,
    metadata: {
      id_tarea: draft.idTarea,
      zona: draft.sectionId,
      origen: "demora",
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function countAlertasOperativasHistorialServer(params: {
  codigoCuenta: string;
  idBodega: string;
}): Promise<number> {
  const client = getSupabaseAdminClient();
  if (!client) return 0;

  const { data, error } = await client
    .from("alerta_operativa")
    .select("id_alerta, metadata")
    .eq("codigo_cuenta", params.codigoCuenta)
    .eq("id_bodega", params.idBodega);

  if (error || !data) return 0;

  return data.filter((row) => {
    const metadata = row.metadata as Record<string, unknown> | null;
    return metadata?.subtipo !== "llamada_jefe";
  }).length;
}

export async function syncDemoraAlertasHistorialServer(params: {
  codigoCuenta: string;
  idBodega: string;
}): Promise<{ persisted: number; alertasTotal: number }> {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY no configurada en el servidor.",
    );
  }

  const { codigoCuenta, idBodega } = params;

  const tareasRaw = await loadTareasPendientes(admin, { codigoCuenta, idBodega });
  const tareas = tareasRaw.filter(isTareaPendienteOperativa);

  const [ordenes, ubicaciones, stock] = await Promise.all([
    loadOrdenesTrabajoForBodega(admin, { codigoCuenta, idBodega }),
    loadUbicaciones(admin, idBodega),
    loadWarehouseState(admin, { codigoCuenta, idBodega }),
  ]);

  const codigoByUbicacion = new Map(
    ubicaciones.map((ubicacion) => [ubicacion.id_ubicacion, ubicacion.codigo]),
  );
  const ingresoUbicacionIds = listIngresoUbicacionIds(ubicaciones);
  const salidaUbicacionIds = listSalidaUbicacionIds(ubicaciones);
  const almacenUbicacionIds = listAlmacenamientoVentaUbicacionIds(ubicaciones);

  const tareasEnriquecidas = enrichTareasConOrden(
    tareas,
    ordenes,
    codigoByUbicacion,
  );

  const tareasVisibles = filterTareasOvDuplicadas(
    tareasEnriquecidas,
    ordenes,
    stock as unknown as import("@/modules/inventory/shared/types/inventory.types").WarehouseStateRow[],
    almacenUbicacionIds,
  );

  const demoras = collectDemoraAlertasOperativas(tareasVisibles, {
    ingresoUbicacionIds,
    salidaUbicacionIds,
  });

  let persisted = 0;

  for (const draft of demoras) {
    const exists = await demoraAlertaYaRegistrada(admin, {
      codigoCuenta,
      idBodega,
      idTarea: draft.idTarea,
    });

    if (exists) continue;

    await persistDemoraAlerta(admin, { codigoCuenta, idBodega }, draft);
    persisted += 1;
  }

  const alertasTotal = await countAlertasOperativasHistorialServer({
    codigoCuenta,
    idBodega,
  });

  return { persisted, alertasTotal };
}
