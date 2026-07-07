"use client";

import { useCallback, useMemo } from "react";
import { ModuleListPage } from "@/components/shared/module/ModuleListPage";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { formatEstadoOrdenVenta } from "@/modules/sales/shared/constants/sales-status";
import { listOrdenesVentaOperador } from "@/modules/sales";
import type { OrdenVentaOperadorRow } from "@/modules/sales";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  CUSTODIO_ORDEN_VENTA_TABLE_MIN_WIDTH_CLASS,
  custodioOrdenVentaColumnClass,
} from "../constants/custodio-ordenes-table-layout";
import { CustodioRefreshButton } from "./CustodioRefreshButton";
import { CustodioTabPageShell } from "./CustodioTabPageShell";
import { CustodioTableCellText } from "./CustodioTableCellText";

function renderEstadoBadge(estado: OrdenVentaOperadorRow["estado"]) {
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

export function CustodioOrdenVentaPageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();

  const fetchOrdenes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listOrdenesVentaOperador({
      codigoCuenta,
      idBodega: activeBodegaId,
    });
  }, [activeBodegaId, codigoCuenta]);

  const { data, isLoading, error, reload, isRefreshing } = useAsyncQuery(
    fetchOrdenes,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "orden",
          header: "Orden",
          cell: (row: OrdenVentaOperadorRow) => (
            <PolariaTableCode>{row.venta}</PolariaTableCode>
          ),
          headerClassName: custodioOrdenVentaColumnClass("orden"),
          cellClassName: custodioOrdenVentaColumnClass("orden"),
        },
        {
          id: "cuenta",
          header: "Cuenta",
          cell: (row: OrdenVentaOperadorRow) => (
            <CustodioTableCellText text={row.cuenta} />
          ),
          headerClassName: custodioOrdenVentaColumnClass("cuenta"),
          cellClassName: custodioOrdenVentaColumnClass("cuenta"),
        },
        {
          id: "comprador",
          header: "Comprador",
          cell: (row: OrdenVentaOperadorRow) => (
            <CustodioTableCellText
              text={row.comprador}
              title={row.comprador !== "—" ? row.comprador : undefined}
            />
          ),
          headerClassName: custodioOrdenVentaColumnClass("comprador"),
          cellClassName: custodioOrdenVentaColumnClass("comprador"),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: OrdenVentaOperadorRow) => renderEstadoBadge(row.estado),
          headerClassName: custodioOrdenVentaColumnClass("estado"),
          cellClassName: custodioOrdenVentaColumnClass("estado"),
        },
        {
          id: "fecha",
          header: "Fecha",
          cell: (row: OrdenVentaOperadorRow) => formatDateTime(row.fecha),
          headerClassName: custodioOrdenVentaColumnClass("fecha"),
          cellClassName: custodioOrdenVentaColumnClass("fecha"),
        },
        {
          id: "destino",
          header: "Destino",
          cell: (row: OrdenVentaOperadorRow) => (
            <CustodioTableCellText text={row.destino} title={row.destino} />
          ),
          headerClassName: custodioOrdenVentaColumnClass("destino"),
          cellClassName: custodioOrdenVentaColumnClass("destino"),
        },
        {
          id: "productos",
          header: "Productos",
          cell: (row: OrdenVentaOperadorRow) => (
            <CustodioTableCellText text={row.productos} className="font-medium" />
          ),
          headerClassName: custodioOrdenVentaColumnClass("productos"),
          cellClassName: custodioOrdenVentaColumnClass("productos"),
        },
      ] as const,
    [],
  );

  return (
    <CustodioTabPageShell
      activeTab="orden-venta"
      subtitle="Consulta de órdenes de venta de la bodega activa."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <CustodioRefreshButton
          onClick={() => void reload()}
          disabled={!codigoCuenta}
          isRefreshing={isRefreshing}
        />
      </div>

      {!codigoCuenta ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          No se encontró la cuenta activa.
        </p>
      ) : (
        <ModuleListPage
          isLoading={isLoading}
          error={error}
          rows={rows}
          columns={columns}
          emptyMessage="Sin órdenes de venta registradas."
          getRowKey={(row) => row.idOrdenVenta}
          tableClassName={CUSTODIO_ORDEN_VENTA_TABLE_MIN_WIDTH_CLASS}
        />
      )}
    </CustodioTabPageShell>
  );
}
