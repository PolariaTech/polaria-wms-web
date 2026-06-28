"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ModuleListPage } from "@/components/shared/ModuleListPage";
import { PolariaTableBadge } from "@/components/shared/PolariaTableCells";
import { formatDateTime } from "@/components/shared/formatters";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
import { cn } from "@/lib/cn";
import { useCompany } from "@/providers/CompanyProvider";
import {
  formatEstadoProcesamiento,
  formatKilos,
  formatUnidades,
} from "../constants/processing-status";
import { listSolicitudesProcesamientoOperador } from "../services/processing.service";
import type { SolicitudProcesamientoOperadorRow } from "../types/processing.types";
import { OrdenProcesamientoCreateModal } from "./OrdenProcesamientoCreateModal";

function renderEstadoBadge(estado: string) {
  const normalized = estado.toLowerCase();
  const variant =
    normalized === "terminada"
      ? "positive"
      : normalized === "cancelada"
        ? "neutral"
        : normalized === "pendiente"
          ? "warning"
          : "neutral";

  return (
    <PolariaTableBadge variant={variant}>
      {formatEstadoProcesamiento(estado)}
    </PolariaTableBadge>
  );
}

export function OperadorProcesamientoPageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchSolicitudes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listSolicitudesProcesamientoOperador({
      codigoCuenta,
      idBodega: activeBodegaId,
    });
  }, [activeBodegaId, codigoCuenta]);

  const { data, isLoading, error, reload } = useAsyncQuery(
    fetchSolicitudes,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () => [
      {
        id: "orden",
        header: "Orden",
        cell: (row: SolicitudProcesamientoOperadorRow) => row.orden,
      },
      {
        id: "primario",
        header: "Primario",
        cell: (row: SolicitudProcesamientoOperadorRow) => row.primario,
      },
      {
        id: "secundario",
        header: "Secundario",
        cell: (row: SolicitudProcesamientoOperadorRow) => row.secundario,
      },
      {
        id: "insumo",
        header: "Insumo primario",
        cell: (row: SolicitudProcesamientoOperadorRow) =>
          formatKilos(row.insumoPrimario),
      },
      {
        id: "estimado",
        header: "Estim. sec.",
        cell: (row: SolicitudProcesamientoOperadorRow) =>
          formatUnidades(row.estimSecundario),
      },
      {
        id: "estado",
        header: "Estado",
        cell: (row: SolicitudProcesamientoOperadorRow) =>
          renderEstadoBadge(row.estado),
      },
      {
        id: "fecha",
        header: "Fecha",
        cell: (row: SolicitudProcesamientoOperadorRow) =>
          formatDateTime(row.fecha),
        cellClassName: "text-polaria-w-50",
      },
    ],
    [],
  );

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="polaria-text-body-sm text-polaria-w-50">
          Órdenes de procesamiento de la bodega interna activa.
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
          Nueva orden
        </button>
      </div>

      <ModuleListPage
        isLoading={isLoading}
        error={error}
        rows={rows}
        columns={columns}
        emptyMessage="Sin órdenes de procesamiento registradas."
        getRowKey={(row) => row.idSolicitudProcesamiento}
      />

      <OrdenProcesamientoCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </>
  );
}
