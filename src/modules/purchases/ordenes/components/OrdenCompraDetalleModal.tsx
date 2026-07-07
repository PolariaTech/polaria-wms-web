"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { ESTADO_ORDEN_LABELS } from "../../shared/constants/purchases-labels";
import type { DestinoTipoOrden, OrdenCompraRow } from "../../shared/types/purchases.types";
import {
  formatFechaOrden,
  formatObservacionOrden,
  parseDestinoTipoOrden,
  resolveOrdenLineaTitulo,
  toFechaOrdenInputValue,
} from "../utils/orden-compra-display";

export interface OrdenCompraDestinoPatch {
  destinoTipo?: DestinoTipoOrden;
  fechaEntregaEstimada?: string | null;
}

interface OrdenCompraDetalleModalProps {
  orden: OrdenCompraRow | null;
  onClose: () => void;
  actions?: ReactNode;
  notified?: boolean;
  onDestinoChange?: (patch: OrdenCompraDestinoPatch) => void | Promise<void>;
  isSavingDestino?: boolean;
  destinoError?: string | null;
}

const DESTINO_TIPO_OPTIONS = [
  { value: "interna", label: "Bodega interna" },
  { value: "externa", label: "Bodega externa" },
] as const;

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
      <div className="mt-1 polaria-text-body-sm font-medium text-polaria-w">
        {children}
      </div>
    </div>
  );
}

export function OrdenCompraDetalleModal({
  orden,
  onClose,
  actions,
  notified = false,
  onDestinoChange,
  isSavingDestino = false,
  destinoError = null,
}: OrdenCompraDetalleModalProps) {
  const [destinoTipo, setDestinoTipo] = useState<DestinoTipoOrden>("interna");
  const [fechaEntrega, setFechaEntrega] = useState("");

  useEffect(() => {
    if (!orden) {
      return;
    }

    setDestinoTipo(parseDestinoTipoOrden(orden.destino_tipo));
    setFechaEntrega(toFechaOrdenInputValue(orden.fecha_entrega_estimada));
  }, [orden]);

  if (!orden) {
    return null;
  }

  const lineItems = orden.lineas ?? [];
  const observaciones = formatObservacionOrden(orden.observaciones);
  const canEditDestino = orden.estado === "borrador" && Boolean(onDestinoChange);

  const handleDestinoTipoChange = (nextTipo: DestinoTipoOrden) => {
    if (!canEditDestino || nextTipo === destinoTipo || isSavingDestino) {
      return;
    }

    setDestinoTipo(nextTipo);
    void onDestinoChange?.({ destinoTipo: nextTipo });
  };

  const handleFechaEntregaChange = (nextFecha: string) => {
    if (!canEditDestino || nextFecha === fechaEntrega || isSavingDestino) {
      return;
    }

    setFechaEntrega(nextFecha);
    void onDestinoChange?.({
      fechaEntregaEstimada: nextFecha.trim() ? nextFecha : null,
    });
  };

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

      <section className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-4">
        <h3 className="polaria-text-label text-polaria-teal">Destino</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {canEditDestino ? (
            <PolariaFormInput
              id="orden-fecha-entrega"
              label="Llegada estimada"
              type="date"
              value={fechaEntrega}
              onChange={(event) => handleFechaEntregaChange(event.target.value)}
              disabled={isSavingDestino}
              compact
            />
          ) : (
            <MetaField label="Llegada estimada">
              {formatFechaOrden(orden.fecha_entrega_estimada)}
            </MetaField>
          )}

          {canEditDestino ? (
            <PolariaFormSelect
              id="orden-destino-tipo"
              label="Tipo"
              value={destinoTipo}
              onChange={(event) =>
                handleDestinoTipoChange(event.target.value as DestinoTipoOrden)
              }
              disabled={isSavingDestino}
              options={[...DESTINO_TIPO_OPTIONS]}
              compact
            />
          ) : (
            <MetaField label="Tipo">
              {
                DESTINO_TIPO_OPTIONS.find((option) => option.value === destinoTipo)
                  ?.label
              }
            </MetaField>
          )}
        </div>

        {destinoError ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-body-sm text-polaria-danger"
          >
            {destinoError}
          </p>
        ) : null}
      </section>

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
