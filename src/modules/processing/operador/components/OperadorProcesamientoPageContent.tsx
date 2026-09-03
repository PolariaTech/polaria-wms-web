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
  formatEstadoProcesamiento,
  formatKilos,
  formatUnidades,
} from "../../shared/constants/processing-status";
import { listSolicitudesProcesamientoOperador } from "../../shared/services/processing.service";
import type { SolicitudProcesamientoOperadorRow } from "../../shared/types/processing.types";
import { OrdenProcesamientoCreateModal } from "../../solicitudes/components/OrdenProcesamientoCreateModal";
import {
  PROCESAMIENTO_TABLE_MIN_WIDTH_CLASS,
  procesamientoTableColumnClass,
} from "../constants/procesamiento-table-layout";

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

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchSolicitudes,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () => [
      {
        id: "orden",
        header: "Orden",
        headerClassName: procesamientoTableColumnClass("orden"),
        cellClassName: procesamientoTableColumnClass("orden"),
        cell: (row: SolicitudProcesamientoOperadorRow) => (
          <PolariaTableCode>{row.orden}</PolariaTableCode>
        ),
      },
      {
        id: "primario",
        header: "Primario",
        headerClassName: procesamientoTableColumnClass("primario"),
        cellClassName: procesamientoTableColumnClass("primario"),
        cell: (row: SolicitudProcesamientoOperadorRow) => row.primario,
      },
      {
        id: "secundario",
        header: "Secundario",
        headerClassName: procesamientoTableColumnClass("secundario"),
        cellClassName: procesamientoTableColumnClass("secundario"),
        cell: (row: SolicitudProcesamientoOperadorRow) => row.secundario,
      },
      {
        id: "insumo",
        header: "Insumo primario",
        headerClassName: procesamientoTableColumnClass("insumo"),
        cellClassName: procesamientoTableColumnClass("insumo"),
        cell: (row: SolicitudProcesamientoOperadorRow) =>
          formatKilos(row.insumoPrimario),
      },
      {
        id: "estimado",
        header: "Estim. sec.",
        headerClassName: procesamientoTableColumnClass("estimado"),
        cellClassName: procesamientoTableColumnClass("estimado"),
        cell: (row: SolicitudProcesamientoOperadorRow) =>
          formatUnidades(row.estimSecundario),
      },
      {
        id: "estado",
        header: "Estado",
        headerClassName: procesamientoTableColumnClass("estado"),
        cellClassName: procesamientoTableColumnClass("estado"),
        cell: (row: SolicitudProcesamientoOperadorRow) =>
          renderEstadoBadge(row.estado),
      },
      {
        id: "fecha",
        header: "Fecha",
        headerClassName: procesamientoTableColumnClass("fecha"),
        cellClassName: procesamientoTableColumnClass("fecha"),
        cell: (row: SolicitudProcesamientoOperadorRow) =>
          formatDateTime(row.fecha),
      },
    ],
    [],
  );

  return (
    <>
      <PolariaDataTable
        title="Órdenes de procesamiento"
        subtitle="Orden, primario y estado."
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idSolicitudProcesamiento}
        emptyMessage="Sin órdenes de procesamiento registradas."
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Nueva orden",
          onClick: () => {
            if (!codigoCuenta) return;
            setIsCreateOpen(true);
          },
        }}
        tableClassName={PROCESAMIENTO_TABLE_MIN_WIDTH_CLASS}
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
