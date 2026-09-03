"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  formatEstadoIntegracion,
  formatTipoIntegracion,
} from "../constants/integration-types";
import {
  INTEGRACION_TABLE_MIN_WIDTH_CLASS,
  integracionTableColumnClass,
} from "../constants/integracion-table-layout";
import { listSolicitudesIntegracion } from "../services/integracion-bodega.service";
import type { SolicitudIntegracionRow } from "../../shared/types/integration.types";
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

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchSolicitudes,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () => [
      {
        id: "bodega",
        header: "Bodega externa",
        headerClassName: integracionTableColumnClass("bodega"),
        cellClassName: integracionTableColumnClass("bodega"),
        cell: (row: SolicitudIntegracionRow) => (
          <PolariaTableCode>{row.bodegaNombre}</PolariaTableCode>
        ),
      },
      {
        id: "tipo",
        header: "Tipo de integración",
        headerClassName: integracionTableColumnClass("tipo"),
        cellClassName: integracionTableColumnClass("tipo"),
        cell: (row: SolicitudIntegracionRow) =>
          formatTipoIntegracion(row.tipoIntegracion),
      },
      {
        id: "fecha",
        header: "Fecha",
        headerClassName: integracionTableColumnClass("fecha"),
        cellClassName: integracionTableColumnClass("fecha"),
        cell: (row: SolicitudIntegracionRow) => formatDateTime(row.createdAt),
      },
      {
        id: "estado",
        header: "Estado",
        headerClassName: integracionTableColumnClass("estado"),
        cellClassName: integracionTableColumnClass("estado"),
        cell: (row: SolicitudIntegracionRow) => renderEstadoBadge(row.estado),
      },
    ],
    [],
  );

  return (
    <>
      <PolariaDataTable
        title="Solicitudes de integración"
        subtitle="Bodega, tipo y estado."
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idSolicitudIntegracion}
        emptyMessage="Sin solicitudes de integración registradas."
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Solicitar integración",
          onClick: () => {
            if (!codigoCuenta) return;
            setIsCreateOpen(true);
          },
        }}
        tableClassName={INTEGRACION_TABLE_MIN_WIDTH_CLASS}
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
