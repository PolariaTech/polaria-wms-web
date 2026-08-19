"use client";

import type { ReactNode } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { ESTADO_SOLICITUD_LABELS } from "../../shared/constants/purchases-labels";
import type { SolicitudCompraRow } from "../../shared/types/purchases.types";
import { formatFechaOrden, formatObservacionOrden } from "../../ordenes/utils/orden-compra-display";
import {
  pesosProductosSolicitud,
  resolveLineaTitulo,
} from "../utils/solicitud-compra-display";

interface SolicitudCompraDetalleModalProps {
  solicitud: SolicitudCompraRow | null;
  onClose: () => void;
  actions?: ReactNode;
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
      <div className="mt-1 polaria-text-body-sm font-medium text-polaria-w">
        {children}
      </div>
    </div>
  );
}

export function SolicitudCompraDetalleModal({
  solicitud,
  onClose,
  actions,
}: SolicitudCompraDetalleModalProps) {
  if (!solicitud) {
    return null;
  }

  const lineItems = solicitud.lineas ?? [];
  const observaciones = formatObservacionOrden(solicitud.observaciones);

  return (
    <PolariaFormModal
      open
      onClose={onClose}
      sectionLabel="Detalle de solicitud"
      title={solicitud.codigo}
      isSubmitting={false}
      onSubmit={(event) => {
        event.preventDefault();
      }}
      footerAction={actions ?? <></>}
      compact
      size="lg"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetaField label="Fecha">
          {formatFechaOrden(solicitud.created_at)}
        </MetaField>
        <MetaField label="Estado">
          <PolariaTableBadge variant="neutral">
            {ESTADO_SOLICITUD_LABELS[solicitud.estado] ?? solicitud.estado}
          </PolariaTableBadge>
        </MetaField>
        <MetaField label="Peso total">
          <span className="tabular-nums">{pesosProductosSolicitud(solicitud)}</span>
        </MetaField>
      </div>

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
                key={linea.id_linea_solicitud_compra}
                className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3"
              >
                <p className="font-medium text-polaria-w">
                  {resolveLineaTitulo(linea)}
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

      {observaciones !== "—" ? (
        <section className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
          <p className="polaria-text-label mb-1 text-polaria-w-20">Observaciones</p>
          <p>{observaciones}</p>
        </section>
      ) : null}
    </PolariaFormModal>
  );
}
