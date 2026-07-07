"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { useWarehouseStateRealtime } from "@/hooks/warehouse/useWarehouseStateRealtime";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import { mapEstadoBodegaLayout } from "../utils/estado-bodega-mapper";
import { listUbicacionesEstadoBodega } from "../services/estado-bodega.service";
import { getEstadoBodegaZonePanelData } from "../services/estado-bodega-zone.service";
import type {
  EstadoBodegaSectionView,
  UbicacionEstadoBodegaDbRow,
} from "../types/estado-bodega.types";
import type { EstadoBodegaSectionId } from "../constants/estado-bodega-layout";
import type { EstadoBodegaZonePanelKind } from "../constants/estado-bodega-zone-panel";
import {
  countAlertasForSection,
  countPendingTasksForSection,
  filterAlertasForSection,
  filterTareasForSection,
  mapAlertaToPanelItem,
  mapTareaToPanelItem,
  type AlertaOperativaListRow,
} from "../utils/estado-bodega-zone-panel";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { EstadoBodegaLegend } from "./EstadoBodegaLegend";
import { EstadoBodegaSectionPanel } from "./EstadoBodegaSectionPanel";
import { EstadoBodegaZonePanelModal } from "./EstadoBodegaZonePanelModal";
import { useEstadoBodegaSlotSize } from "../hooks/useEstadoBodegaSlotSize";

interface ZonePanelState {
  kind: EstadoBodegaZonePanelKind;
  sectionId: EstadoBodegaSectionId;
}

function enrichSectionsWithZoneCounts(
  sections: EstadoBodegaSectionView[],
  alertas: AlertaOperativaListRow[],
  tareas: TareaColaRow[],
): EstadoBodegaSectionView[] {
  return sections.map((section) => ({
    ...section,
    alertCount: countAlertasForSection(alertas, section.id),
    pendingTaskCount: countPendingTasksForSection(tareas, section.id),
  }));
}

export function EstadoBodegaPageContent({
  operacionTabs,
}: {
  operacionTabs: ReactNode;
}) {
  const { activeBodegaId } = useCompany();
  const [ubicaciones, setUbicaciones] = useState<UbicacionEstadoBodegaDbRow[]>(
    [],
  );
  const [isLoadingUbicaciones, setIsLoadingUbicaciones] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [alertas, setAlertas] = useState<AlertaOperativaListRow[]>([]);
  const [tareas, setTareas] = useState<TareaColaRow[]>([]);
  const [isLoadingZonePanel, setIsLoadingZonePanel] = useState(false);
  const [zonePanel, setZonePanel] = useState<ZonePanelState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const slotSize = useEstadoBodegaSlotSize(containerRef, "operativo");

  const {
    rows: warehouseRows,
    isConnected,
    isLoading: isLoadingWarehouse,
    error: warehouseError,
  } = useWarehouseStateRealtime();

  const loadUbicaciones = useCallback(async () => {
    if (!activeBodegaId) {
      setUbicaciones([]);
      return;
    }

    setIsLoadingUbicaciones(true);
    setLayoutError(null);

    try {
      const rows = await listUbicacionesEstadoBodega(activeBodegaId);
      setUbicaciones(rows);
    } catch (error) {
      setLayoutError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el layout de la bodega.",
      );
      setUbicaciones([]);
    } finally {
      setIsLoadingUbicaciones(false);
    }
  }, [activeBodegaId]);

  useEffect(() => {
    void loadUbicaciones();
  }, [loadUbicaciones]);

  const loadZonePanelData = useCallback(async () => {
    if (!activeBodegaId) {
      setAlertas([]);
      setTareas([]);
      return;
    }

    setIsLoadingZonePanel(true);

    try {
      const data = await getEstadoBodegaZonePanelData(activeBodegaId);
      setAlertas(data.alertas);
      setTareas(data.tareas);
    } catch {
      setAlertas([]);
      setTareas([]);
    } finally {
      setIsLoadingZonePanel(false);
    }
  }, [activeBodegaId]);

  useEffect(() => {
    void loadZonePanelData();
  }, [loadZonePanelData]);

  const layout = useMemo(
    () => mapEstadoBodegaLayout(ubicaciones, warehouseRows),
    [ubicaciones, warehouseRows],
  );

  const sections = useMemo(
    () => enrichSectionsWithZoneCounts(layout.sections, alertas, tareas),
    [alertas, layout.sections, tareas],
  );
  const isLoading = isLoadingUbicaciones || isLoadingWarehouse;
  const error = layoutError ?? warehouseError;

  const sectionById = useMemo(
    () => new Map(sections.map((section) => [section.id, section])),
    [sections],
  );

  const activePanelSection = zonePanel
    ? sectionById.get(zonePanel.sectionId)
    : undefined;

  const activePanelItems = useMemo(() => {
    if (!zonePanel) return [];

    if (zonePanel.kind === "alertas") {
      return filterAlertasForSection(alertas, zonePanel.sectionId).map(
        mapAlertaToPanelItem,
      );
    }

    return filterTareasForSection(tareas, zonePanel.sectionId).map(
      mapTareaToPanelItem,
    );
  }, [alertas, tareas, zonePanel]);

  const openZonePanel = useCallback(
    (kind: EstadoBodegaZonePanelKind, sectionId: EstadoBodegaSectionId) => {
      setZonePanel({ kind, sectionId });
    },
    [],
  );

  const renderSectionPanel = (
    sectionId: EstadoBodegaSectionId,
    panelProps: {
      compact?: boolean;
      fillHeight?: boolean;
      className?: string;
    } = {},
  ) => {
    const section = sectionById.get(sectionId);
    if (!section) return null;

    return (
      <EstadoBodegaSectionPanel
        section={section}
        slotSize={slotSize}
        compact={panelProps.compact}
        fillHeight={panelProps.fillHeight}
        className={panelProps.className}
        onOpenAlertas={() => openZonePanel("alertas", sectionId)}
        onOpenTareas={() => openZonePanel("tareas", sectionId)}
      />
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="polaria-text-display">Estado de bodega</h1>
        <p className="polaria-text-subtitle mt-2 text-polaria-w-50">
          Mapa operativo de slots por zona —{" "}
          {isConnected ? "En vivo" : "Sincronizando…"}
        </p>
      </header>

      {operacionTabs}

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger"
        >
          {error}
        </p>
      ) : null}

      {!activeBodegaId ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          Selecciona una bodega activa para ver el estado operativo.
        </p>
      ) : isLoading && ubicaciones.length === 0 ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          Cargando estado de bodega…
        </p>
      ) : (
        <div
          ref={containerRef}
          className="mx-auto flex w-full flex-col gap-6"
        >
          <div
            ref={mapRef}
            className={cn(
              "mx-auto grid w-fit max-w-full grid-cols-1 gap-3",
              "lg:grid-cols-[auto_auto_auto] lg:items-stretch",
            )}
          >
            <div className="flex min-h-[14rem] min-w-0 flex-col items-center lg:min-h-0 lg:h-full">
              {renderSectionPanel("entrada", {
                compact: true,
                fillHeight: true,
                className: "h-full min-h-0",
              })}
            </div>

            <div className="flex min-h-[14rem] min-w-0 flex-col items-center gap-2.5 lg:min-h-0 lg:h-full">
              {renderSectionPanel("almacenamiento", { compact: true })}
              {renderSectionPanel("procesamiento", { compact: true })}
            </div>

            <div className="flex min-h-[14rem] min-w-0 flex-col items-center lg:min-h-0 lg:h-full">
              {renderSectionPanel("salida", {
                compact: true,
                fillHeight: true,
                className: "h-full min-h-0",
              })}
            </div>
          </div>

          <EstadoBodegaLegend />
        </div>
      )}

      {zonePanel && activePanelSection ? (
        <EstadoBodegaZonePanelModal
          open
          onClose={() => setZonePanel(null)}
          kind={zonePanel.kind}
          sectionId={zonePanel.sectionId}
          sectionTitle={activePanelSection.title}
          items={activePanelItems}
          isLoading={isLoadingZonePanel}
        />
      ) : null}
    </main>
  );
}
