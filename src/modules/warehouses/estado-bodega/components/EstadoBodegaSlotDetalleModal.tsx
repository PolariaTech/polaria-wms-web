"use client";

import type { ReactNode } from "react";
import { formatKilos } from "@/modules/processing/shared/constants/processing-status";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import type { EstadoBodegaSlotDetalleView } from "../types/estado-bodega.types";

interface EstadoBodegaSlotDetalleModalProps {
  open: boolean;
  onClose: () => void;
  detalle: EstadoBodegaSlotDetalleView | null;
  slotNumber: number | null;
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="polaria-text-label text-polaria-w-20">{label}</p>
      <div className="mt-1 break-words polaria-text-body-sm font-medium text-polaria-w">
        {children}
      </div>
    </div>
  );
}

export function EstadoBodegaSlotDetalleModal({
  open,
  onClose,
  detalle,
  slotNumber,
}: EstadoBodegaSlotDetalleModalProps) {
  if (!open || !detalle) {
    return null;
  }

  const rol = detalle.rolProcesamiento;
  const esSobrante = rol === "sobrante";
  const esResultado = rol === "procesado";

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      sectionLabel={
        slotNumber != null ? `Slot ${slotNumber}` : "Detalle de slot"
      }
      title={detalle.productoNombre}
      description={
        esSobrante
          ? "Sobrante del primario pendiente de devolver a almacenamiento."
          : esResultado
            ? "Producto procesado pendiente de ubicar en almacenamiento."
            : "Información del producto en esta ubicación."
      }
      isSubmitting={false}
      onSubmit={(event) => {
        event.preventDefault();
      }}
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="md"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetaField label="Nombre completo">{detalle.productoNombre}</MetaField>
        <MetaField label="Id único / paquete">
          {detalle.idPaquete ?? "—"}
        </MetaField>
        <MetaField label="Cliente">{detalle.cliente ?? "—"}</MetaField>
        <MetaField label="Cantidad">{detalle.cantidad}</MetaField>
        <MetaField label="Posición">{detalle.posicion ?? "—"}</MetaField>
        <MetaField label="Temperatura">{detalle.temperatura ?? "—"}</MetaField>
        <MetaField label="Orden de compra">
          {detalle.ordenCompraCodigo ?? "—"}
        </MetaField>
        {esResultado || detalle.resultadoNombre ? (
          <MetaField label={esResultado ? "Producto procesado" : "Resultado"}>
            <span className="text-polaria-teal">
              {esResultado
                ? detalle.productoNombre
                : detalle.resultadoNombre}
            </span>
          </MetaField>
        ) : null}
        {esSobrante && detalle.sobranteKg != null && detalle.sobranteKg > 0 ? (
          <MetaField label="Sobrante (primario)">
            <span className="text-polaria-teal">
              {formatKilos(detalle.sobranteKg)}
            </span>
          </MetaField>
        ) : null}
        {!esSobrante &&
        !esResultado &&
        detalle.sobranteKg != null &&
        detalle.sobranteKg > 0 ? (
          <MetaField label="Sobrante (primario)">
            <span className="text-polaria-teal">
              {formatKilos(detalle.sobranteKg)}
            </span>
          </MetaField>
        ) : null}
      </div>
    </PolariaFormModal>
  );
}
