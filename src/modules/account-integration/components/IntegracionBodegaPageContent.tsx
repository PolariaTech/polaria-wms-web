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
  formatEstadoIntegracion,
  formatTipoIntegracion,
} from "../constants/integration-types";
import { listSolicitudesIntegracion } from "../services/integracion-bodega.service";
import type { SolicitudIntegracionRow } from "../types/integration.types";
import { SolicitudIntegracionCreateModal } from "./SolicitudIntegracionCreateModal";

function renderEstadoBadge(estado: string) {
  const normalized = estado.toLowerCase();
  const variant = normalized === "activo" ? "positive" : "neutral";

  return (
    <PolariaTableBadge variant={variant}>
      {formatEstadoIntegracion(estado)}
    </PolariaTableBadge>
  );
}

export function IntegracionBodegaPageContent() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchSolicitudes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listSolicitudesIntegracion({ codigoCuenta });
  }, [codigoCuenta]);

  const { data, isLoading, error, reload } = useAsyncQuery(
    fetchSolicitudes,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () => [
      {
        id: "bodega",
        header: "Bodega externa",
        cell: (row: SolicitudIntegracionRow) => row.bodegaNombre,
      },
      {
        id: "tipo",
        header: "Tipo de integración",
        cell: (row: SolicitudIntegracionRow) =>
          formatTipoIntegracion(row.tipoIntegracion),
      },
      {
        id: "fecha",
        header: "Fecha",
        cell: (row: SolicitudIntegracionRow) => formatDateTime(row.createdAt),
      },
      {
        id: "estado",
        header: "Estado",
        cell: (row: SolicitudIntegracionRow) => renderEstadoBadge(row.estado),
      },
    ],
    [],
  );

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="polaria-text-body-sm text-polaria-w-50">
          Solicitudes de integración con bodegas externas de la cuenta.
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
          Solicitar integración
        </button>
      </div>

      <ModuleListPage
        isLoading={isLoading}
        error={error}
        rows={rows}
        columns={columns}
        emptyMessage="Sin solicitudes de integración registradas."
        getRowKey={(row) => row.idSolicitudIntegracion}
      />

      <SolicitudIntegracionCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </>
  );
}
