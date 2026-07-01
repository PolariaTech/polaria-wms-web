"use client";

import type { ReactNode } from "react";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { formatKgEs } from "@/lib/decimal-es";
import type { SolicitudCompraRow } from "../types/purchases.types";
import {
  nombresProductosSolicitud,
  resolveLineaTitulo,
} from "../utils/solicitud-compra-display";

interface SolicitudCompraDetalleModalProps {
  solicitud: SolicitudCompraRow | null;
  onClose: () => void;
  actions?: ReactNode;
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

  return (
    <PolariaFormModal
      open
      onClose={onClose}
      sectionLabel="Detalle de solicitud"
      title={solicitud.codigo}
      description={nombresProductosSolicitud(solicitud)}
      submitLabel="Cerrar"
      isSubmitting={false}
      onSubmit={(event) => {
        event.preventDefault();
        onClose();
      }}
      compact
      size="md"
    >
      <p className="polaria-text-label text-polaria-w-50">Productos y peso</p>

      {lineItems.length === 0 ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          Esta solicitud no tiene líneas registradas.
        </p>
      ) : (
        <ul className="space-y-3">
          {lineItems.map((linea) => (
            <li
              key={linea.id_linea_solicitud_compra}
              className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3"
            >
              <p className="font-medium text-polaria-w">
                {resolveLineaTitulo(linea)}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 polaria-text-body-sm text-polaria-w-50">
                <span>
                  <span className="text-polaria-w-20">Peso:</span>{" "}
                  <span className="font-semibold tabular-nums text-polaria-w">
                    {formatKgEs(Number(linea.cantidad))} kg
                  </span>
                </span>
                {linea.producto?.sku ? (
                  <span>SKU {linea.producto.sku}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {actions ? (
        <div className="flex flex-wrap justify-end gap-2 border-t border-polaria-w-08 pt-4">
          {actions}
        </div>
      ) : null}
    </PolariaFormModal>
  );
}
