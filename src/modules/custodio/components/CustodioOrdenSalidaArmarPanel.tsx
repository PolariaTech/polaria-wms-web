"use client";

import type { ReactNode } from "react";
import { Package, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import type { OrdenVentaOperadorRow } from "@/modules/sales";
import {
  primaryButtonClass,
  secondaryButtonClass,
  type PickerKind,
} from "./custodio-orden-salida.helpers";

interface CustodioOrdenSalidaArmarPanelProps {
  isLoading: boolean;
  paqueteFieldLabel: string;
  detalleFieldLabel: string;
  ventasSeleccionadas: OrdenVentaOperadorRow[];
  selectedCount: number;
  mezclaCuentas: boolean;
  previsualizarButton: ReactNode;
  onOpenPicker: (picker: PickerKind) => void;
  onRemoveVenta: (idOrdenVenta: string) => void;
  onRefresh: () => void;
  onArmarPaquete: () => void;
}

export function CustodioOrdenSalidaArmarPanel({
  isLoading,
  paqueteFieldLabel,
  detalleFieldLabel,
  ventasSeleccionadas,
  selectedCount,
  mezclaCuentas,
  previsualizarButton,
  onOpenPicker,
  onRemoveVenta,
  onRefresh,
  onArmarPaquete,
}: CustodioOrdenSalidaArmarPanelProps) {
  return (
    <>
      <div className="flex shrink-0 flex-col gap-1.5">
        <label
          htmlFor="custodio-salida-paquete-venta"
          className="polaria-text-caption text-polaria-w-50"
        >
          Ventas para el mismo camión
        </label>
        <JefeBodegaModalSearchField
          id="custodio-salida-paquete-venta"
          value={paqueteFieldLabel}
          placeholder="Buscar órdenes de venta"
          ariaLabel="Ventas para el paquete"
          onSearchClick={isLoading ? undefined : () => onOpenPicker("paquete")}
        />
        {ventasSeleccionadas.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {ventasSeleccionadas.map((venta) => (
              <li
                key={venta.idOrdenVenta}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2 py-0.5"
              >
                <span className="truncate polaria-text-caption text-polaria-w">
                  {venta.venta}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveVenta(venta.idOrdenVenta)}
                  aria-label={`Quitar ${venta.venta}`}
                  className="rounded-full p-0.5 text-polaria-w-50 transition hover:text-polaria-teal"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {mezclaCuentas ? (
        <p className="polaria-text-caption font-medium text-polaria-danger">
          Las ventas del mismo envío deben ser de la misma cuenta.
        </p>
      ) : null}

      <div className="flex shrink-0 flex-col gap-1.5">
        <label
          htmlFor="custodio-salida-detalle-venta"
          className="polaria-text-caption text-polaria-w-50"
        >
          Venta para detalle (opcional)
        </label>
        <JefeBodegaModalSearchField
          id="custodio-salida-detalle-venta"
          value={detalleFieldLabel}
          placeholder="Buscar orden de venta"
          ariaLabel="Venta para detalle"
          onSearchClick={isLoading ? undefined : () => onOpenPicker("detalle")}
        />
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className={secondaryButtonClass}
      >
        <RefreshCw
          className={cn("h-4 w-4", isLoading && "animate-spin")}
          aria-hidden
        />
        Actualizar
      </button>

      {previsualizarButton}

      <div className="rounded-xl border border-dashed border-polaria-t-20 bg-polaria-w-08 p-3">
        <p className="polaria-text-caption font-semibold uppercase tracking-wide text-polaria-teal">
          Paquete de despacho
        </p>
        {selectedCount === 0 ? (
          <p className="mt-2 polaria-text-caption text-polaria-w-50">
            Buscá y agregá al menos una venta para armar el paquete.
          </p>
        ) : (
          <>
            <p className="mt-2 polaria-text-caption text-polaria-w-50">
              Previsualizá los productos y armá el paquete para elegir camión.
            </p>
            <button
              type="button"
              disabled={mezclaCuentas || isLoading}
              onClick={onArmarPaquete}
              className={cn("mt-3", primaryButtonClass)}
            >
              <Package className="h-4 w-4" aria-hidden />
              Armar paquete de despacho
            </button>
          </>
        )}
      </div>
    </>
  );
}
