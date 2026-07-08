"use client";

import { Box, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { POLARIA_FORM_SELECT_CLASS_COMPACT } from "@/components/shared/form/PolariaFormField";
import { formatOrdenIngresoSelectLabel } from "@/modules/purchases/ingreso/utils/recepcion-compra-draft";
import type { OrdenCompraRow } from "@/modules/purchases";
import { CustodioOrdenIngresoForm } from "./CustodioOrdenIngresoForm";
import { CustodioSidePanel } from "./CustodioSidePanel";

interface CustodioOrdenIngresoColumnProps {
  ordenes: OrdenCompraRow[];
  codigoCuenta: string | null;
  idBodega: string | null;
  resolveUbicacionIngreso: () => string | null;
  slotsIngresoCount: number;
  selectedOrdenId: string;
  onSelectOrden: (id: string) => void;
  onRefresh: () => void;
  onIngresoRegistrado?: () => void | Promise<void>;
  isLoading: boolean;
  slotSize: number;
}

export function CustodioOrdenIngresoColumn({
  ordenes,
  codigoCuenta,
  idBodega,
  resolveUbicacionIngreso,
  slotsIngresoCount,
  selectedOrdenId,
  onSelectOrden,
  onRefresh,
  onIngresoRegistrado,
  isLoading,
  slotSize,
}: CustodioOrdenIngresoColumnProps) {
  const ordenCount = ordenes.length;

  const ordenSeleccionada = useMemo(
    () => ordenes.find((orden) => orden.id_orden_compra === selectedOrdenId) ?? null,
    [ordenes, selectedOrdenId],
  );

  const puedeRegistrar = Boolean(
    ordenSeleccionada && codigoCuenta && idBodega,
  );

  return (
    <CustodioSidePanel
      slotSize={slotSize}
      panelClassName="polaria-card-glow border-polaria-t-20 bg-polaria-t-08"
      className="h-full min-h-0"
    >
      <header className="mb-2 flex w-full shrink-0 flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 shrink items-center gap-2">
          <Box
            className="h-4 w-4 shrink-0 text-polaria-teal"
            strokeWidth={1.75}
            aria-hidden
          />
          <h2 className="truncate polaria-text-body-sm font-semibold text-polaria-teal">
            Orden de ingreso
          </h2>
        </div>
        <span className="rounded-full border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-0.5 polaria-text-caption text-polaria-teal">
          {ordenCount} órdenes
        </span>
      </header>

      <div className="flex shrink-0 flex-col gap-3">
        <label
          htmlFor="custodio-orden-ingreso-select"
          className="polaria-text-caption text-polaria-w-50"
        >
          Orden de compra
        </label>
        <select
          id="custodio-orden-ingreso-select"
          value={selectedOrdenId}
          onChange={(event) => onSelectOrden(event.target.value)}
          disabled={isLoading || ordenCount === 0}
          className={POLARIA_FORM_SELECT_CLASS_COMPACT}
        >
          <option value="" className="polaria-form-select__option">
            {isLoading ? "Cargando órdenes…" : "Seleccioná una orden"}
          </option>
          {ordenes.map((orden) => (
            <option
              key={orden.id_orden_compra}
              value={orden.id_orden_compra}
              className="polaria-form-select__option"
            >
              {formatOrdenIngresoSelectLabel(orden)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-xl",
            "border border-polaria-t-20 bg-polaria-w-08 px-4 py-2.5",
            "polaria-text-body-sm font-medium text-polaria-w",
            "transition hover:border-polaria-teal hover:text-polaria-teal",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <RefreshCw
            className={cn("h-4 w-4", isLoading && "animate-spin")}
            aria-hidden
          />
          Actualizar
        </button>
      </div>

      {puedeRegistrar && ordenSeleccionada && codigoCuenta && idBodega ? (
        <CustodioOrdenIngresoForm
          key={ordenSeleccionada.id_orden_compra}
          orden={ordenSeleccionada}
          codigoCuenta={codigoCuenta}
          resolveUbicacionIngreso={resolveUbicacionIngreso}
          slotsIngresoCount={slotsIngresoCount}
          onRegistered={async () => {
            onSelectOrden("");
            await onIngresoRegistrado?.();
          }}
        />
      ) : null}

      {ordenCount === 0 && !isLoading ? (
        <p className="mt-auto w-full shrink-0 pt-2 text-center polaria-text-caption text-polaria-w-50">
          No hay órdenes en transporte para esta bodega.
        </p>
      ) : null}
    </CustodioSidePanel>
  );
}
