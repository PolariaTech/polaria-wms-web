"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useWarehouseStateRealtime } from "@/hooks/warehouse/useWarehouseStateRealtime";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { listOrdenesCompra } from "@/modules/purchases";
import type { OrdenCompraRow } from "@/modules/purchases";
import { listOrdenesVentaOperador } from "@/modules/sales";
import type { OrdenVentaOperadorRow } from "@/modules/sales";
import {
  getEstadoBodegaSectionConfig,
  listUbicacionesEstadoBodega,
  mapEstadoBodegaLayout,
  type EstadoBodegaSectionView,
} from "@/modules/warehouses";
import { EstadoBodegaLegend } from "@/modules/warehouses/estado-bodega/components/EstadoBodegaLegend";
import { EstadoBodegaSectionPanel } from "@/modules/warehouses/estado-bodega/components/EstadoBodegaSectionPanel";
import {
  estadoBodegaCustodioColumnHeight,
  useEstadoBodegaSlotSize,
} from "@/modules/warehouses/estado-bodega/hooks/useEstadoBodegaSlotSize";
import { CustodioOperacionTabs } from "./CustodioOperacionTabs";
import { CustodioOrdenIngresoColumn } from "./CustodioOrdenIngresoColumn";
import { CustodioOrdenSalidaColumn } from "./CustodioOrdenSalidaColumn";

const ORDENES_EN_TRANSPORTE = new Set<OrdenCompraRow["estado"]>([
  "emitida",
  "parcialmente_recibida",
]);

function buildEmptySection(
  sectionId: "entrada" | "salida",
): EstadoBodegaSectionView {
  const config = getEstadoBodegaSectionConfig(sectionId);

  return {
    id: config.id,
    title: config.title,
    cols: config.cols,
    rows: config.rows,
    capacity: config.capacity,
    occupiedCount: 0,
    alertCount: 0,
    pendingTaskCount: 0,
    emptyHint: config.emptyHint,
    showOccupancyBadge: config.showOccupancyBadge,
    slots: Array.from({ length: config.capacity }, (_, index) => ({
      slotNumber: index + 1,
      idUbicacion: null,
      codigo: null,
      visual: "vacia" as const,
      productoLabel: null,
    })),
  };
}

export function CustodioIngresoPageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const containerRef = useRef<HTMLDivElement>(null);
  const slotSize = useEstadoBodegaSlotSize(containerRef, "custodio");
  const columnHeight = estadoBodegaCustodioColumnHeight(slotSize);
  const [ubicaciones, setUbicaciones] = useState<
    Awaited<ReturnType<typeof listUbicacionesEstadoBodega>>
  >([]);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  const [ordenes, setOrdenes] = useState<OrdenCompraRow[]>([]);
  const [isLoadingOrdenes, setIsLoadingOrdenes] = useState(false);
  const [selectedOrdenId, setSelectedOrdenId] = useState("");

  const [ventas, setVentas] = useState<OrdenVentaOperadorRow[]>([]);
  const [isLoadingVentas, setIsLoadingVentas] = useState(false);
  const [selectedVentaId, setSelectedVentaId] = useState("");

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

    setIsLoadingLayout(true);
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
      setIsLoadingLayout(false);
    }
  }, [activeBodegaId]);

  const loadOrdenes = useCallback(async () => {
    if (!codigoCuenta) {
      setOrdenes([]);
      return;
    }

    setIsLoadingOrdenes(true);

    try {
      const rows = await listOrdenesCompra({
        codigoCuenta,
        idBodega: activeBodegaId,
      });
      setOrdenes(rows.filter((row) => ORDENES_EN_TRANSPORTE.has(row.estado)));
    } catch {
      setOrdenes([]);
    } finally {
      setIsLoadingOrdenes(false);
    }
  }, [activeBodegaId, codigoCuenta]);

  const loadVentas = useCallback(async () => {
    if (!codigoCuenta) {
      setVentas([]);
      return;
    }

    setIsLoadingVentas(true);

    try {
      const rows = await listOrdenesVentaOperador({ codigoCuenta });
      setVentas(rows);
    } catch {
      setVentas([]);
    } finally {
      setIsLoadingVentas(false);
    }
  }, [codigoCuenta]);

  useEffect(() => {
    void loadUbicaciones();
  }, [loadUbicaciones]);

  useEffect(() => {
    void loadOrdenes();
  }, [loadOrdenes]);

  useEffect(() => {
    void loadVentas();
  }, [loadVentas]);

  const layout = useMemo(
    () => mapEstadoBodegaLayout(ubicaciones, warehouseRows),
    [ubicaciones, warehouseRows],
  );

  const zonaIngreso =
    layout.sections.find((section) => section.id === "entrada") ??
    buildEmptySection("entrada");
  const zonaSalida =
    layout.sections.find((section) => section.id === "salida") ??
    buildEmptySection("salida");

  const cajasEnSalida = zonaSalida.slots.filter(
    (slot) => slot.visual !== "vacia",
  ).length;

  const columnStyle =
    columnHeight > 0 ? { height: columnHeight } : undefined;

  const isLoading = isLoadingLayout || isLoadingWarehouse;
  const error = layoutError ?? warehouseError;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="polaria-text-display">Estado de bodega</h1>
        <p className="polaria-text-subtitle mt-2 text-polaria-w-50">
          Mapa operativo de slots por zona —{" "}
          {isConnected ? "En vivo" : "Sincronizando…"}
        </p>
      </header>

      <CustodioOperacionTabs activeTab="ingreso" />

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
            className={cn(
              "mx-auto grid w-fit max-w-full grid-cols-1 gap-3",
              "lg:grid-cols-[auto_auto_auto_auto] lg:items-start",
            )}
          >
            <div
              style={columnStyle}
              className="flex min-h-[14rem] min-w-0 flex-col items-center lg:min-h-0"
            >
              <CustodioOrdenIngresoColumn
                ordenes={ordenes}
                selectedOrdenId={selectedOrdenId}
                onSelectOrden={setSelectedOrdenId}
                onRefresh={() => void loadOrdenes()}
                isLoading={isLoadingOrdenes}
                slotSize={slotSize}
              />
            </div>

            <div
              style={columnStyle}
              className="flex min-h-[14rem] min-w-0 flex-col items-center lg:min-h-0"
            >
              <EstadoBodegaSectionPanel
                section={zonaIngreso}
                slotSize={slotSize}
                compact
                fillHeight
                variant="custodio"
                titleOverride="Zona de ingreso"
                emptyHintOverride="No hay cajas en ingresos."
                className="h-full min-h-0"
              />
            </div>

            <div
              style={columnStyle}
              className="flex min-h-[14rem] min-w-0 flex-col items-center lg:min-h-0"
            >
              <EstadoBodegaSectionPanel
                section={zonaSalida}
                slotSize={slotSize}
                compact
                fillHeight
                variant="custodio"
                titleOverride="Zona de salida"
                emptyHintOverride="No hay cajas en salida."
                className="h-full min-h-0"
              />
            </div>

            <div
              style={columnStyle}
              className="flex min-h-[14rem] min-w-0 flex-col items-center lg:min-h-0"
            >
              <CustodioOrdenSalidaColumn
                ventas={ventas}
                cajasEnSalida={cajasEnSalida}
                selectedVentaId={selectedVentaId}
                onSelectVenta={setSelectedVentaId}
                onRefresh={() => void loadVentas()}
                isLoading={isLoadingVentas}
                slotSize={slotSize}
              />
            </div>
          </div>

          <EstadoBodegaLegend />
        </div>
      )}
    </main>
  );
}
