import type { EstadoBodegaSectionId } from "../constants/estado-bodega-layout";
import {
  ESTADO_BODEGA_SECTION_TASK_TYPES,
} from "../constants/estado-bodega-zone-panel";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";

export interface EstadoBodegaZonePanelItem {
  id: string;
  title: string;
  subtitle?: string;
}

export interface AlertaOperativaListRow {
  id_alerta: string;
  titulo: string | null;
  descripcion: string | null;
  estado: string;
  created_at: string;
  payload: Record<string, unknown> | null;
}

export function mapAlertaToPanelItem(row: AlertaOperativaListRow): EstadoBodegaZonePanelItem {
  return {
    id: row.id_alerta,
    title: row.titulo?.trim() || "Alerta operativa",
    subtitle: row.descripcion?.trim() || undefined,
  };
}

export function mapTareaToPanelItem(row: TareaColaRow): EstadoBodegaZonePanelItem {
  return {
    id: row.id_tarea,
    title: row.titulo?.trim() || `Tarea ${row.tipo}`,
    subtitle: row.descripcion?.trim() || undefined,
  };
}

export function filterTareasForSection(
  rows: TareaColaRow[],
  sectionId: EstadoBodegaSectionId,
): TareaColaRow[] {
  const allowedTypes = ESTADO_BODEGA_SECTION_TASK_TYPES[sectionId];

  return rows.filter(
    (row) =>
      row.estado === "pendiente" && allowedTypes.includes(row.tipo),
  );
}

export function filterAlertasForSection(
  rows: AlertaOperativaListRow[],
  sectionId: EstadoBodegaSectionId,
): AlertaOperativaListRow[] {
  return rows.filter((row) => {
    const payload = row.payload;
    if (!payload || typeof payload.zona !== "string") {
      return sectionId === "entrada";
    }

    return payload.zona === sectionId;
  });
}

export function countPendingTasksForSection(
  rows: TareaColaRow[],
  sectionId: EstadoBodegaSectionId,
): number {
  return filterTareasForSection(rows, sectionId).length;
}

export function countAlertasForSection(
  rows: AlertaOperativaListRow[],
  sectionId: EstadoBodegaSectionId,
): number {
  return filterAlertasForSection(rows, sectionId).length;
}
