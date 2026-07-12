"use client";

import type { ReactNode } from "react";
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

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      sectionLabel={
        slotNumber != null ? `Slot ${slotNumber}` : "Detalle de slot"
      }
      title={detalle.productoNombre}
      description="Información del producto en esta ubicación."
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
      </div>
    </PolariaFormModal>
  );
}
