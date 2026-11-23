"use client";

import type { ReactNode } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { ESTADO_ORDEN_LABELS } from "../../shared/constants/purchases-labels";
import type { OrdenCompraRow } from "../../shared/types/purchases.types";
import {
  formatBodegaDestinoLabel,
  formatFechaOrden,
  formatObservacionOrden,
  resolveOrdenLineaTitulo,
} from "../utils/orden-compra-display";
import { OrdenCompraDetalleDestinoSection } from "./OrdenCompraDetalleDestinoSection";
import { OrdenCompraDetalleMetaField as MetaField } from "./OrdenCompraDetalleMetaField";
import type { OrdenCompraDestinoPatch } from "./orden-compra-detalle.types";
import { useOrdenCompraDestino } from "./useOrdenCompraDestino";

export type { OrdenCompraDestinoPatch } from "./orden-compra-detalle.types";

interface OrdenCompraDetalleModalProps {
  orden: OrdenCompraRow | null;
  codigoCuenta?: string | null;
  onClose: () => void;
  actions?: ReactNode;
  notified?: boolean;
  onDestinoChange?: (patch: OrdenCompraDestinoPatch) => void | Promise<void>;
  isSavingDestino?: boolean;
  destinoError?: string | null;
}

export function OrdenCompraDetalleModalContent({
  orden,
  codigoCuenta = null,
  onClose,
  actions,
  notified = false,
  onDestinoChange,
  isSavingDestino = false,
  destinoError = null,
}: OrdenCompraDetalleModalProps) {
  const destino = useOrdenCompraDestino({
    orden,
    codigoCuenta,
    onDestinoChange,
    isSavingDestino,
  });

  if (!orden) {
    return null;
  }

  const lineItems = orden.lineas ?? [];
  const observaciones = formatObservacionOrden(orden.observaciones);

  const bodegaReadLabel =
    destino.bodegaSeleccionada != null
      ? formatBodegaDestinoLabel(destino.bodegaSeleccionada)
      : orden.id_bodega?.trim()
        ? orden.id_bodega.slice(0, 8)
        : "—";

  return (
    <PolariaFormModal
      open
      onClose={onClose}
      sectionLabel="Detalle de orden"
      title={orden.codigo}
      isSubmitting={false}
      onSubmit={(event) => {
        event.preventDefault();
      }}
      footerAction={actions ?? <></>}
      compact
      size="lg"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetaField label="Proveedor">
          {orden.proveedor_nombre?.trim() || "—"}
        </MetaField>
        <MetaField label="Fecha">
          {formatFechaOrden(orden.fecha_emision)}
        </MetaField>
        <MetaField label="Estado">
          <PolariaTableBadge variant="neutral">
            {ESTADO_ORDEN_LABELS[orden.estado] ?? orden.estado}
          </PolariaTableBadge>
        </MetaField>
      </div>

      <OrdenCompraDetalleDestinoSection
        orden={orden}
        canEditDestino={destino.canEditDestino}
        destinoTipo={destino.destinoTipo}
        idBodega={destino.idBodega}
        fechaEntrega={destino.fechaEntrega}
        bodegasDestino={destino.bodegasDestino}
        bodegaOptions={destino.bodegaOptions}
        bodegaReadLabel={bodegaReadLabel}
        isLoadingBodegas={destino.isLoadingBodegas}
        isSavingDestino={isSavingDestino}
        bodegasError={destino.bodegasError}
        destinoError={destinoError}
        onFechaEntregaChange={destino.handleFechaEntregaChange}
        onDestinoTipoChange={destino.handleDestinoTipoChange}
        onBodegaChange={destino.handleBodegaChange}
      />

      <section>
        <h3 className="polaria-text-label text-polaria-teal">Productos</h3>

        {lineItems.length === 0 ? (
          <p className="mt-3 polaria-text-body-sm text-polaria-w-50">
            Sin líneas registradas.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {lineItems.map((linea) => (
              <li
                key={linea.id_linea_orden_compra}
                className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3"
              >
                <p className="font-medium text-polaria-w">
                  {resolveOrdenLineaTitulo(linea)}
                </p>
                <p className="mt-1 polaria-text-body-sm text-polaria-w-50">
                  <span className="text-polaria-w-20">Peso:</span>{" "}
                  <span className="font-semibold tabular-nums text-polaria-w">
                    {formatKgEs(Number(linea.cantidad))} kg
                  </span>
                  {linea.producto?.sku ? (
                    <span className="ml-3">SKU {linea.producto.sku}</span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {observaciones !== "—" || notified ? (
        <section className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
          {observaciones !== "—" ? <p>{observaciones}</p> : null}
          {notified ? (
            <p className={observaciones !== "—" ? "mt-2" : undefined}>
              Proveedor notificado.
            </p>
          ) : null}
        </section>
      ) : null}
    </PolariaFormModal>
  );
}
