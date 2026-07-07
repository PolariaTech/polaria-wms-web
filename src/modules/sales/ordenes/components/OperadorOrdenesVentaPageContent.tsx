"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ModuleListPage } from "@/components/shared/module/ModuleListPage";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { cn } from "@/lib/utils/cn";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { formatEstadoOrdenVenta } from "../../shared/constants/sales-status";
import { listOrdenesVentaOperador } from "../../shared/services/sales.service";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { OrdenVentaCreateModal } from "./OrdenVentaCreateModal";

function renderEstadoBadge(estado: string) {
  const normalized = estado.toLowerCase();
  const variant =
    normalized === "despachada" || normalized === "cerrada"
      ? "positive"
      : normalized === "cancelada"
        ? "neutral"
        : normalized === "confirmada" || normalized === "en_preparacion"
          ? "warning"
          : "neutral";

  return (
    <PolariaTableBadge variant={variant}>
      {formatEstadoOrdenVenta(estado)}
    </PolariaTableBadge>
  );
}

export function OperadorOrdenesVentaPageContent() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchOrdenes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listOrdenesVentaOperador({ codigoCuenta });
  }, [codigoCuenta]);

  const { data, isLoading, error, reload } = useAsyncQuery(
    fetchOrdenes,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () => [
      {
        id: "venta",
        header: "Venta",
        cell: (row: OrdenVentaOperadorRow) => row.venta,
      },
      {
        id: "comprador",
        header: "Comprador",
        cell: (row: OrdenVentaOperadorRow) => row.comprador,
      },
      {
        id: "productos",
        header: "Productos",
        cell: (row: OrdenVentaOperadorRow) => row.productos,
        cellClassName: "text-polaria-w-50",
      },
      {
        id: "estado",
        header: "Estado",
        cell: (row: OrdenVentaOperadorRow) => renderEstadoBadge(row.estado),
      },
      {
        id: "fecha",
        header: "Fecha",
        cell: (row: OrdenVentaOperadorRow) => formatDateTime(row.fecha),
        cellClassName: "text-polaria-w-50",
      },
    ],
    [],
  );

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="polaria-text-body-sm text-polaria-w-50">
          Órdenes de venta manuales de la cuenta.
        </p>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          disabled={!codigoCuenta}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-3",
            "polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
          )}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nueva venta
        </button>
      </div>

      <ModuleListPage
        isLoading={isLoading}
        error={error}
        rows={rows}
        columns={columns}
        emptyMessage="Sin órdenes de venta registradas."
        getRowKey={(row) => row.idOrdenVenta}
      />

      <OrdenVentaCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </>
  );
}
