import {
  DEFAULT_LIST_LIMIT,
  requireIdBodega,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import type { AlertaOperativaListRow } from "../utils/estado-bodega-zone-panel";

const ALERTA_COLUMNS =
  "id_alerta,titulo,descripcion,estado,created_at,payload";

const TAREA_COLUMNS =
  "id_tarea,codigo_cuenta,id_bodega,tipo,estado,id_asignado,id_orden_trabajo,titulo,descripcion,created_at,updated_at";

export async function listAlertasEstadoBodega(
  idBodega: string,
): Promise<AlertaOperativaListRow[]> {
  const resolvedId = requireIdBodega(idBodega);

  return runDomainQuery((client) => {
    const query = client
      .from("alerta_operativa")
      .select(ALERTA_COLUMNS)
      .eq("id_bodega", resolvedId)
      .eq("estado", "abierta")
      .order("created_at", { ascending: false })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: AlertaOperativaListRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function listTareasEstadoBodega(
  idBodega: string,
): Promise<TareaColaRow[]> {
  const resolvedId = requireIdBodega(idBodega);

  return runDomainQuery((client) => {
    const query = client
      .from("tarea_cola")
      .select(TAREA_COLUMNS)
      .eq("id_bodega", resolvedId)
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: TareaColaRow[] | null;
      error: { message: string } | null;
    }>;
  });
}

export async function getEstadoBodegaZonePanelData(idBodega: string) {
  const [alertas, tareas] = await Promise.all([
    listAlertasEstadoBodega(idBodega),
    listTareasEstadoBodega(idBodega),
  ]);

  return { alertas, tareas };
}
