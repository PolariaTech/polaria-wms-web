"use client";

import { cn } from "@/lib/utils/cn";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { formatOrdenIngresoResumen } from "@/modules/purchases/ingreso/utils/recepcion-compra-draft";
import type { OrdenCompraRow } from "@/modules/purchases/shared/types/purchases.types";
import { CustodioOrdenIngresoLineasList } from "./CustodioOrdenIngresoLineasList";
import { CustodioOrdenIngresoProductoAdicional } from "./CustodioOrdenIngresoProductoAdicional";
import { useCustodioOrdenIngresoForm } from "./useCustodioOrdenIngresoForm";

interface CustodioOrdenIngresoFormProps {
  orden: OrdenCompraRow;
  codigoCuenta: string;
  resolveUbicacionIngreso: () => string | null;
  slotsIngresoCount: number;
  onRegistered: () => void | Promise<void>;
}

export function CustodioOrdenIngresoFormContent({
  orden,
  codigoCuenta,
  resolveUbicacionIngreso,
  slotsIngresoCount,
  onRegistered,
}: CustodioOrdenIngresoFormProps) {
  const form = useCustodioOrdenIngresoForm({
    orden,
    codigoCuenta,
    resolveUbicacionIngreso,
    slotsIngresoCount,
    onRegistered,
  });

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 border-t border-polaria-w-08 pt-3">
      <p className="polaria-text-caption text-polaria-w-50">
        {formatOrdenIngresoResumen(orden)}
      </p>

      {form.isLoadingLineas ? (
        <PolariaStatusLoading
          embedded
          title="Cargando líneas…"
          message="Estamos preparando las líneas de la orden."
          className="py-4"
        />
      ) : form.lineas.length === 0 ? (
        <p className="polaria-text-caption text-polaria-w-50">
          La orden no tiene líneas para recepcionar.
        </p>
      ) : (
        <CustodioOrdenIngresoLineasList
          lineas={form.lineas}
          isSubmitting={form.isSubmitting}
          onUpdateLinea={form.updateLinea}
        />
      )}

      <CustodioOrdenIngresoProductoAdicional
        productoAdicional={form.productoAdicional}
        setProductoAdicional={form.setProductoAdicional}
        catalogo={form.catalogo}
        isSubmitting={form.isSubmitting}
        isLoadingCatalogo={form.isLoadingCatalogo}
      />

      {form.error ? (
        <p
          role="alert"
          className="rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-caption text-polaria-danger"
        >
          {form.error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void form.handleSubmit()}
        disabled={!form.canSubmit || form.isSubmitting || form.isLoadingLineas}
        className={cn(
          "mt-auto w-full rounded-xl px-3 py-3 font-semibold leading-snug transition",
          "disabled:cursor-not-allowed disabled:opacity-50",
          form.canSubmit && !form.isSubmitting
            ? "bg-polaria-teal text-sm font-semibold text-polaria-on-teal hover:opacity-90"
            : "border border-polaria-w-08 bg-polaria-w-08 polaria-text-caption text-polaria-w-50",
        )}
      >
        {form.isSubmitting
          ? "Registrando ingreso…"
          : "Registrar ingreso y cerrar orden."}
      </button>
    </div>
  );
}
