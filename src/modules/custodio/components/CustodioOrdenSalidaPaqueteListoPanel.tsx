"use client";

import type { ReactNode } from "react";
import { Package } from "lucide-react";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import type { OrdenVentaOperadorRow } from "@/modules/sales";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "./custodio-orden-salida.helpers";

interface CustodioOrdenSalidaPaqueteListoPanelProps {
  ventasPaquete: OrdenVentaOperadorRow[];
  cajasEnSalida: number;
  camionFieldLabel: string;
  camionPickerPlaceholder: string;
  camionPickerEnabled: boolean;
  enviando: boolean;
  puedeEnviar: boolean;
  previsualizarButton: ReactNode;
  onOpenCamionPicker: () => void;
  onEnviar: () => void;
  onCancelar: () => void;
}

export function CustodioOrdenSalidaPaqueteListoPanel({
  ventasPaquete,
  cajasEnSalida,
  camionFieldLabel,
  camionPickerPlaceholder,
  camionPickerEnabled,
  enviando,
  puedeEnviar,
  previsualizarButton,
  onOpenCamionPicker,
  onEnviar,
  onCancelar,
}: CustodioOrdenSalidaPaqueteListoPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-dashed border-polaria-t-20 bg-polaria-t-08 p-3">
        <p className="polaria-text-caption font-semibold uppercase tracking-wide text-polaria-teal">
          Paquete listo
        </p>
        <ul className="mt-2 space-y-1">
          {ventasPaquete.map((venta) => (
            <li
              key={venta.idOrdenVenta}
              className="polaria-text-caption font-semibold text-polaria-w"
            >
              {venta.venta}{" "}
              <span className="font-normal text-polaria-w-50">
                · {venta.comprador}
              </span>
            </li>
          ))}
        </ul>

        {cajasEnSalida <= 0 ? (
          <p className="mt-2 rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 polaria-text-caption text-polaria-warning">
            No hay cajas en zona de salida para estas ventas.
          </p>
        ) : (
          <p className="mt-2 polaria-text-caption text-polaria-w-50">
            Se enviarán{" "}
            <strong className="text-polaria-w">{cajasEnSalida}</strong>{" "}
            caja(s). Las ventas pasarán a transporte.
          </p>
        )}

        <div className="mt-3 grid gap-1.5">
          <label
            htmlFor="custodio-orden-salida-camion"
            className="polaria-text-caption text-polaria-w-50"
          >
            Camión asignado
          </label>
          <JefeBodegaModalSearchField
            id="custodio-orden-salida-camion"
            value={camionFieldLabel}
            placeholder={camionPickerPlaceholder}
            ariaLabel="Camión asignado"
            onSearchClick={camionPickerEnabled ? onOpenCamionPicker : undefined}
          />
        </div>
      </div>

      {previsualizarButton}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!puedeEnviar}
          onClick={onEnviar}
          className={primaryButtonClass}
        >
          <Package className="h-4 w-4" aria-hidden />
          {enviando ? "Enviando…" : "Enviar paquete al transporte"}
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={onCancelar}
          className={secondaryButtonClass}
        >
          Cancelar paquete
        </button>
      </div>
    </div>
  );
}
