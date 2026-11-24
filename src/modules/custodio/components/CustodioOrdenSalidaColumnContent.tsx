"use client";

import { ArrowRightFromLine, Eye } from "lucide-react";
import { JefeBodegaOrdenVentaPickerModal } from "@/modules/jefe-bodega/components/modals/JefeBodegaOrdenVentaPickerModal";
import type { OrdenVentaOperadorRow } from "@/modules/sales";
import { CustodioOrdenSalidaArmarPanel } from "./CustodioOrdenSalidaArmarPanel";
import { CustodioOrdenSalidaCamionPickerModal } from "./CustodioOrdenSalidaCamionPickerModal";
import { CustodioOrdenSalidaPaqueteListoPanel } from "./CustodioOrdenSalidaPaqueteListoPanel";
import { CustodioOrdenSalidaPreviewModal } from "./CustodioOrdenSalidaPreviewModal";
import { CustodioSidePanel } from "./CustodioSidePanel";
import { secondaryButtonClass } from "./custodio-orden-salida.helpers";
import { useCustodioOrdenSalida } from "./useCustodioOrdenSalida";

interface CustodioOrdenSalidaColumnProps {
  ventas: OrdenVentaOperadorRow[];
  cajasEnSalida: number;
  codigoCuenta: string | null;
  idBodega: string | null;
  onRefresh: () => void;
  onPaqueteEnviado?: () => void;
  isLoading: boolean;
  slotSize: number;
}

export function CustodioOrdenSalidaColumnContent({
  ventas,
  cajasEnSalida,
  codigoCuenta,
  idBodega,
  onRefresh,
  onPaqueteEnviado,
  isLoading,
  slotSize,
}: CustodioOrdenSalidaColumnProps) {
  const salida = useCustodioOrdenSalida({
    ventas,
    cajasEnSalida,
    codigoCuenta,
    idBodega,
    onRefresh,
    onPaqueteEnviado,
  });

  const previsualizarButton = (
    <button
      type="button"
      disabled={!salida.canPreview}
      onClick={() => salida.setPreviewOpen(true)}
      className={secondaryButtonClass}
    >
      <Eye className="h-4 w-4" aria-hidden />
      Previsualizar
    </button>
  );

  return (
    <>
      <CustodioSidePanel
        slotSize={slotSize}
        panelClassName="polaria-card-glow border-polaria-t-20 bg-polaria-t-08"
        className="h-full min-h-0"
      >
        <header className="mb-2 flex w-full shrink-0 flex-row flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 shrink items-center gap-2">
            <ArrowRightFromLine
              className="h-4 w-4 shrink-0 text-polaria-teal"
              strokeWidth={1.75}
              aria-hidden
            />
            <h2 className="truncate polaria-text-body-sm font-semibold text-polaria-w">
              Orden de salida
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-0.5 polaria-text-caption text-polaria-w">
              {salida.paqueteArmado ? "Paquete" : `${cajasEnSalida} cajas`}
            </span>
            <span className="rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-0.5 polaria-text-caption text-polaria-teal">
              {salida.ventasActivas.length} ventas
            </span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {!salida.paqueteArmado ? (
            <CustodioOrdenSalidaArmarPanel
              isLoading={isLoading}
              paqueteFieldLabel={salida.paqueteFieldLabel}
              detalleFieldLabel={salida.detalleFieldLabel}
              ventasSeleccionadas={salida.ventasSeleccionadas}
              selectedCount={salida.selectedKeys.length}
              mezclaCuentas={salida.mezclaCuentas}
              previsualizarButton={previsualizarButton}
              onOpenPicker={salida.setPicker}
              onRemoveVenta={salida.handleRemovePaqueteVenta}
              onRefresh={onRefresh}
              onArmarPaquete={salida.handleArmarPaquete}
            />
          ) : (
            <CustodioOrdenSalidaPaqueteListoPanel
              ventasPaquete={salida.ventasPaquete}
              cajasEnSalida={cajasEnSalida}
              camionFieldLabel={salida.camionFieldLabel}
              camionPickerPlaceholder={salida.camionPickerPlaceholder}
              camionPickerEnabled={
                !(
                  salida.enviando ||
                  salida.loadingCamiones ||
                  salida.camiones.length === 0
                )
              }
              enviando={salida.enviando}
              puedeEnviar={
                !(
                  salida.enviando ||
                  cajasEnSalida <= 0 ||
                  !salida.selectedCamion
                )
              }
              previsualizarButton={previsualizarButton}
              onOpenCamionPicker={() => {
                void salida.loadCamiones();
                salida.setPicker("camion");
              }}
              onEnviar={() => void salida.handleEnviarPaquete()}
              onCancelar={salida.handleCancelarPaquete}
            />
          )}
        </div>
      </CustodioSidePanel>

      <JefeBodegaOrdenVentaPickerModal
        open={salida.picker === "paquete"}
        onClose={() => salida.setPicker(null)}
        ordenes={salida.ventasActivas}
        loading={isLoading}
        selectedId={null}
        onSelect={salida.handleSelectPaqueteVenta}
      />

      <JefeBodegaOrdenVentaPickerModal
        open={salida.picker === "detalle"}
        onClose={() => salida.setPicker(null)}
        ordenes={salida.ventasActivas}
        loading={isLoading}
        selectedId={salida.detalleVentaId || null}
        onSelect={(orden) => {
          salida.setDetalleVentaId(orden.idOrdenVenta);
          salida.setPicker(null);
        }}
      />

      <CustodioOrdenSalidaCamionPickerModal
        open={salida.picker === "camion"}
        onClose={() => salida.setPicker(null)}
        camiones={salida.camiones}
        selectedKey={salida.camionId || null}
        onSelect={(row) => {
          salida.setCamionId(row.idCamion);
          salida.setPicker(null);
        }}
      />

      <CustodioOrdenSalidaPreviewModal
        open={salida.previewOpen}
        onClose={() => salida.setPreviewOpen(false)}
        loading={salida.loadingPreview}
        rows={salida.previewRows}
      />
    </>
  );
}
