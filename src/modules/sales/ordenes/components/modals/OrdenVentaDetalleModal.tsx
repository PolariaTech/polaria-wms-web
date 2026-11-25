"use client";

import { useCallback, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { useEmitirOrdenVentaDetalle } from "../../hooks/use-emitir-orden-venta-detalle";
import { useOrdenVentaDetalleData } from "../../hooks/use-orden-venta-detalle-data";
import { useOrdenVentaDetalleOt } from "../../hooks/use-orden-venta-detalle-ot";
import type { AutoPrintOvResult } from "../../print/auto-print-ov-tras-emitir";
import { formatCompradorOrdenVenta } from "../../utils/display/orden-venta-display";
import { OrdenTrabajoPager } from "../orden-trabajo/OrdenTrabajoPager";
import {
  textoConteoOrdenesTrabajo,
  tituloDetalleOvConOt,
} from "./detalle-venta-presentacion";
import {
  DetalleCypherToggleButton,
  DetalleEmitirButton,
} from "./OrdenVentaDetalleAcciones";
import { OrdenVentaDetalleContent } from "./OrdenVentaDetalleContent";
import type { CypherCompanionOtPicker } from "./OrdenVentaCypherDrawer";

interface OrdenVentaDetalleModalProps {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  onClose: () => void;
  onEmitted?: () => void;
  /** Tras confirmar OK: folio para el modal de éxito (REQ-039). */
  onEmitSuccess?: (info: { idOrdenVenta: string; codigo: string }) => void;
  onAutoPrintResult?: (result: AutoPrintOvResult) => void;
  inspect?: boolean;
  /** Cypher abierto en paralelo (mismo id): panel a la izquierda. */
  cypherOpen?: boolean;
  /** Abre/cierra Cypher de esta OV (botón +). */
  onToggleCypher?: () => void;
  /**
   * Publica el selector de OT al Cypher (varias OT): la izquierda muestra la elegida.
   */
  onCompanionOtPickerChange?: (
    picker: CypherCompanionOtPicker | null,
  ) => void;
}

const CLASE_ALERTA =
  "rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger";

export function OrdenVentaDetalleModal({
  idOrdenVenta,
  codigoCuenta,
  onClose,
  onEmitted,
  onEmitSuccess,
  onAutoPrintResult,
  inspect = false,
  cypherOpen = false,
  onToggleCypher,
  onCompanionOtPickerChange,
}: OrdenVentaDetalleModalProps) {
  const [hijaId, setHijaId] = useState<string | null>(null);
  const resetHija = useCallback(() => setHijaId(null), []);

  const {
    orden,
    setOrden,
    isLoading,
    error,
    actionError,
    setActionError,
    reloadDetalle,
  } = useOrdenVentaDetalleData({ idOrdenVenta, codigoCuenta, inspect, resetHija });

  const { ordenesTrabajo, hijaActiva, indiceOt } = useOrdenVentaDetalleOt({
    origenCorreo:
      typeof orden?.origen_correo === "string" ? orden.origen_correo : null,
    idOrdenVenta,
    hijaId,
    setHijaId,
    cypherOpen,
    inspect,
    onCompanionOtPickerChange,
  });

  const puedeEmitir = !inspect && orden?.estado === "por_confirmar";
  const { isEmitting, handleEmitir } = useEmitirOrdenVentaDetalle({
    idOrdenVenta,
    codigoCuenta,
    orden,
    puedeEmitir,
    setOrden,
    setActionError,
    reloadDetalle,
    onEmitted,
    onEmitSuccess,
    onAutoPrintResult,
  });

  if (!idOrdenVenta) {
    return null;
  }

  return (
    <PolariaFormModal
      open
      onClose={onClose}
      sectionLabel="Detalle de venta"
      title={
        orden
          ? tituloDetalleOvConOt(orden.codigo, indiceOt + 1, ordenesTrabajo.length)
          : "Orden de venta"
      }
      description={
        orden ? formatCompradorOrdenVenta(orden) : "Ficha de captura del pedido."
      }
      isSubmitting={isEmitting}
      onSubmit={(event) => {
        event.preventDefault();
      }}
      layout={cypherOpen ? "dock-left" : "center"}
      closeOnBackdrop={!cypherOpen}
      hideHeaderClose
      headerTrailing={
        cypherOpen ? undefined : (
          <DetalleCypherToggleButton
            onToggleCypher={onToggleCypher}
            onClose={onClose}
          />
        )
      }
      footerAction={
        puedeEmitir ? (
          <DetalleEmitirButton
            disabled={isLoading || isEmitting}
            isEmitting={isEmitting}
            onEmitir={handleEmitir}
          />
        ) : (
          <></>
        )
      }
      compact
      size="2xl"
    >
      {isLoading ? <PolariaStatusLoading embedded className="py-4" /> : null}

      {error ? (
        <p role="alert" className={CLASE_ALERTA}>
          {error}
        </p>
      ) : null}

      {actionError ? (
        <p role="alert" className={CLASE_ALERTA}>
          {actionError}
        </p>
      ) : null}

      {!isLoading && !error && orden ? (
        <div className="space-y-3">
          {ordenesTrabajo.length > 0 ? (
            <p className="polaria-text-caption text-polaria-w-50">
              {textoConteoOrdenesTrabajo(ordenesTrabajo.length)}
            </p>
          ) : null}
          <OrdenVentaDetalleContent
            orden={orden}
            hija={hijaActiva}
            codigoCuenta={codigoCuenta}
            idOrdenVenta={idOrdenVenta}
            mostrarTotalOv={ordenesTrabajo.length > 1}
            tareaTotal={Math.max(1, ordenesTrabajo.length)}
          />
          <OrdenTrabajoPager
            page={indiceOt}
            total={ordenesTrabajo.length}
            onPrev={() => setHijaId(ordenesTrabajo[indiceOt - 1]?.id ?? null)}
            onNext={() => setHijaId(ordenesTrabajo[indiceOt + 1]?.id ?? null)}
          />
        </div>
      ) : null}
    </PolariaFormModal>
  );
}
