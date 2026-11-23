"use client";

import { useRef } from "react";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { cn } from "@/lib/utils/cn";
import { EstadoBodegaLegend } from "@/modules/warehouses/estado-bodega/components/EstadoBodegaLegend";
import { EstadoBodegaSectionPanel } from "@/modules/warehouses/estado-bodega/components/EstadoBodegaSectionPanel";
import {
  estadoBodegaCustodioColumnHeight,
  useEstadoBodegaSlotSize,
} from "@/modules/warehouses/estado-bodega/hooks/useEstadoBodegaSlotSize";
import { EstadoBodegaSlotDetalleModal } from "@/modules/warehouses/estado-bodega/components/EstadoBodegaSlotDetalleModal";
import { CustodioOperacionTabs } from "./CustodioOperacionTabs";
import { CustodioOrdenIngresoColumn } from "./CustodioOrdenIngresoColumn";
import { CustodioOrdenSalidaColumn } from "./CustodioOrdenSalidaColumn";
import { useCustodioIngresoPage } from "./useCustodioIngresoPage";

export function CustodioIngresoPageContentImpl() {
  const {
    codigoCuenta,
    activeBodegaId,
    ubicaciones,
    ordenes,
    isLoadingOrdenes,
    selectedOrdenId,
    setSelectedOrdenId,
    ventas,
    isLoadingVentas,
    selectedSlot,
    setSelectedSlot,
    isConnected,
    handleSelectSlot,
    loadOrdenes,
    loadVentas,
    slotsIngresoCount,
    resolveUbicacionIngreso,
    handleIngresoRegistrado,
    handlePaqueteEnviado,
    zonaIngreso,
    zonaSalida,
    cajasEnSalida,
    isLoading,
    error,
  } = useCustodioIngresoPage();
  const containerRef = useRef<HTMLDivElement>(null);
  const slotSize = useEstadoBodegaSlotSize(containerRef, "custodio");
  const columnHeight = estadoBodegaCustodioColumnHeight(slotSize);
  const columnStyle =
    columnHeight > 0 ? { height: columnHeight } : undefined;

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
        <PolariaStatusLoading
          title="Cargando estado de bodega…"
          message="Estamos preparando el mapa operativo."
        />
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
                codigoCuenta={codigoCuenta}
                idBodega={activeBodegaId}
                resolveUbicacionIngreso={resolveUbicacionIngreso}
                slotsIngresoCount={slotsIngresoCount}
                selectedOrdenId={selectedOrdenId}
                onSelectOrden={setSelectedOrdenId}
                onRefresh={() => void loadOrdenes()}
                onIngresoRegistrado={handleIngresoRegistrado}
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
                onSelectSlot={handleSelectSlot}
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
                onSelectSlot={handleSelectSlot}
              />
            </div>

            <div
              style={columnStyle}
              className="flex min-h-[14rem] min-w-0 flex-col items-center lg:min-h-0"
            >
              <CustodioOrdenSalidaColumn
                ventas={ventas}
                cajasEnSalida={cajasEnSalida}
                codigoCuenta={codigoCuenta}
                idBodega={activeBodegaId}
                onRefresh={() => void loadVentas()}
                onPaqueteEnviado={() => void handlePaqueteEnviado()}
                isLoading={isLoadingVentas}
                slotSize={slotSize}
              />
            </div>
          </div>

          <EstadoBodegaLegend />
        </div>
      )}

      <EstadoBodegaSlotDetalleModal
        open={Boolean(selectedSlot?.detalle)}
        onClose={() => setSelectedSlot(null)}
        detalle={selectedSlot?.detalle ?? null}
        slotNumber={selectedSlot?.slotNumber ?? null}
      />
    </main>
  );
}
