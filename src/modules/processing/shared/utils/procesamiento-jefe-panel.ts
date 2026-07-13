import { formatKilos } from "@/modules/processing/shared/constants/processing-status";
import { solicitudTieneSobrantePendiente } from "@/modules/processing/shared/constants/procesamiento-post-cierre";
import { solicitudProcesamientoTieneTareaCola } from "@/modules/processing/shared/constants/procesamiento-solicitud-ref";
import type { SolicitudProcesamientoOperadorRow } from "@/modules/processing/shared/types/processing.types";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import type { EstadoBodegaZonePanelItem } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-panel";

export function filterSolicitudesOperadorPendientesJefe(
  solicitudes: SolicitudProcesamientoOperadorRow[],
  tareasPendientes: TareaColaRow[],
  solicitudIdsConOperario: ReadonlySet<string> = new Set(),
): SolicitudProcesamientoOperadorRow[] {
  return solicitudes.filter((solicitud) => {
    if (solicitud.estado !== "pendiente") return false;
    if (solicitudIdsConOperario.has(solicitud.idSolicitudProcesamiento)) {
      return false;
    }
    return !solicitudProcesamientoTieneTareaCola(
      solicitud.idSolicitudProcesamiento,
      tareasPendientes,
    );
  });
}

export function mapSolicitudOperadorToPanelItem(
  solicitud: SolicitudProcesamientoOperadorRow,
): EstadoBodegaZonePanelItem {
  return {
    id: `proc-sol-${solicitud.idSolicitudProcesamiento}`,
    title: `${solicitud.orden} · ${solicitud.primario}`,
    subtitle: `Almacenamiento → Procesamiento · ${formatKilos(solicitud.insumoPrimario)} · Sin operario`,
    procesamientoSolicitud: {
      idSolicitudProcesamiento: solicitud.idSolicitudProcesamiento,
      codigo: solicitud.orden,
      idProductoPrimario: "",
      idProductoSecundario: "",
      kilosPrimario: solicitud.insumoPrimario,
      primarioLabel: solicitud.primario,
      secundarioLabel: solicitud.secundario,
    },
  };
}

export function appendProcesamientoSolicitudesOperadorToPanel(
  items: EstadoBodegaZonePanelItem[],
  solicitudes: SolicitudProcesamientoOperadorRow[],
): EstadoBodegaZonePanelItem[] {
  const existingIds = new Set(
    items
      .map((item) => item.procesamientoSolicitud?.idSolicitudProcesamiento)
      .filter(Boolean),
  );

  const extra = solicitudes
    .filter(
      (solicitud) =>
        !existingIds.has(solicitud.idSolicitudProcesamiento),
    )
    .map((solicitud) => mapSolicitudOperadorToPanelItem(solicitud));

  return [...items, ...extra];
}

export function mapPendienteCierreToPanelItem(
  solicitud: SolicitudProcesamientoOperadorRow,
  sobranteKg: string | null | undefined,
): import("@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-panel").EstadoBodegaZonePanelItem {
  const partes = ["Ubicar resultado en almacenamiento"];
  if (solicitudTieneSobrantePendiente(sobranteKg)) {
    partes.push("devolver sobrante primario");
  }

  return {
    id: `proc-cierre-${solicitud.idSolicitudProcesamiento}`,
    title: `${solicitud.orden} · ${solicitud.secundario}`,
    subtitle: `${partes.join(" · ")} · Pend. cierre`,
    procesamientoSolicitud: {
      idSolicitudProcesamiento: solicitud.idSolicitudProcesamiento,
      codigo: solicitud.orden,
      idProductoPrimario: "",
      idProductoSecundario: "",
      kilosPrimario: solicitud.insumoPrimario,
      primarioLabel: solicitud.primario,
      secundarioLabel: solicitud.secundario,
      pendienteCierre: true,
    },
  };
}

export function appendPendientesCierreToProcesamientoPanel(
  items: import("@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-panel").EstadoBodegaZonePanelItem[],
  solicitudes: SolicitudProcesamientoOperadorRow[],
  sobranteById: Map<string, string | null>,
): import("@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-panel").EstadoBodegaZonePanelItem[] {
  const existing = new Set(
    items
      .map((item) => item.procesamientoSolicitud?.idSolicitudProcesamiento)
      .filter(Boolean),
  );

  const extra = solicitudes
    .filter((s) => !existing.has(s.idSolicitudProcesamiento))
    .map((s) =>
      mapPendienteCierreToPanelItem(
        s,
        sobranteById.get(s.idSolicitudProcesamiento) ?? null,
      ),
    );

  return [...items, ...extra];
}

export function mapEnProcesoToPanelItem(
  solicitud: SolicitudProcesamientoOperadorRow,
): EstadoBodegaZonePanelItem {
  return {
    id: `proc-activo-${solicitud.idSolicitudProcesamiento}`,
    title: `${solicitud.orden} · ${solicitud.primario}`,
    subtitle: `En proceso · ${formatKilos(solicitud.insumoPrimario)} en zona procesamiento`,
    procesamientoSolicitud: {
      idSolicitudProcesamiento: solicitud.idSolicitudProcesamiento,
      codigo: solicitud.orden,
      idProductoPrimario: "",
      idProductoSecundario: "",
      kilosPrimario: solicitud.insumoPrimario,
      primarioLabel: solicitud.primario,
      secundarioLabel: solicitud.secundario,
      enProceso: true,
    },
  };
}

export function appendEnProcesoToProcesamientoPanel(
  items: EstadoBodegaZonePanelItem[],
  solicitudes: SolicitudProcesamientoOperadorRow[],
): EstadoBodegaZonePanelItem[] {
  const existing = new Set(
    items
      .map((item) => item.procesamientoSolicitud?.idSolicitudProcesamiento)
      .filter(Boolean),
  );

  const extra = solicitudes
    .filter((s) => !existing.has(s.idSolicitudProcesamiento))
    .map((s) => mapEnProcesoToPanelItem(s));

  return [...items, ...extra];
}
