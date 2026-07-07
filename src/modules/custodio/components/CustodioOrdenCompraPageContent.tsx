"use client";

import { useCallback, useMemo } from "react";
import { ModuleListPage } from "@/components/shared/module/ModuleListPage";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { ESTADO_ORDEN_LABELS } from "@/modules/purchases/shared/constants/purchases-labels";
import { listOrdenesCompra } from "@/modules/purchases";
import type { OrdenCompraRow } from "@/modules/purchases";
import {
  formatDestinoTipoOrden,
  formatFechaOrden,
  nombresProductosOrden,
  productosOrdenTablaResumen,
} from "@/modules/purchases/ordenes/utils/orden-compra-display";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  CUSTODIO_ORDEN_COMPRA_TABLE_MIN_WIDTH_CLASS,
  custodioOrdenCompraColumnClass,
} from "../constants/custodio-ordenes-table-layout";
import { CustodioRefreshButton } from "./CustodioRefreshButton";
import { CustodioTabPageShell } from "./CustodioTabPageShell";
import { CustodioTableCellText } from "./CustodioTableCellText";

function formatEstadoOrden(estado: OrdenCompraRow["estado"]): string {
  return ESTADO_ORDEN_LABELS[estado] ?? estado;
}

export function CustodioOrdenCompraPageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();

  const fetchOrdenes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listOrdenesCompra({
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
          cell: (row: OrdenCompraRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
          headerClassName: custodioOrdenCompraColumnClass("orden"),
          cellClassName: custodioOrdenCompraColumnClass("orden"),
        },
        {
          id: "cuenta",
          header: "Cuenta",
          cell: (row: OrdenCompraRow) => (
            <CustodioTableCellText text={row.codigo_cuenta} />
          ),
          headerClassName: custodioOrdenCompraColumnClass("cuenta"),
          cellClassName: custodioOrdenCompraColumnClass("cuenta"),
        },
        {
          id: "proveedor",
          header: "Proveedor",
          cell: (row: OrdenCompraRow) => (
            <CustodioTableCellText
              text={row.proveedor_nombre?.trim() || "—"}
              title={row.proveedor_nombre?.trim() || undefined}
            />
          ),
          headerClassName: custodioOrdenCompraColumnClass("proveedor"),
          cellClassName: custodioOrdenCompraColumnClass("proveedor"),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: OrdenCompraRow) => (
            <PolariaTableBadge variant="neutral">
              {formatEstadoOrden(row.estado)}
            </PolariaTableBadge>
          ),
          headerClassName: custodioOrdenCompraColumnClass("estado"),
          cellClassName: custodioOrdenCompraColumnClass("estado"),
        },
        {
          id: "fechaOc",
          header: "Fecha OC",
          cell: (row: OrdenCompraRow) => formatFechaOrden(row.fecha_emision),
          headerClassName: custodioOrdenCompraColumnClass("fechaOc"),
          cellClassName: custodioOrdenCompraColumnClass("fechaOc"),
        },
        {
          id: "llegada",
          header: "Llegada",
          cell: (row: OrdenCompraRow) =>
            formatFechaOrden(row.fecha_entrega_estimada),
          headerClassName: custodioOrdenCompraColumnClass("llegada"),
          cellClassName: custodioOrdenCompraColumnClass("llegada"),
        },
        {
          id: "destino",
          header: "Destino",
          cell: (row: OrdenCompraRow) => (
            <CustodioTableCellText
              text={formatDestinoTipoOrden(row.destino_tipo)}
            />
          ),
          headerClassName: custodioOrdenCompraColumnClass("destino"),
          cellClassName: custodioOrdenCompraColumnClass("destino"),
        },
        {
          id: "productos",
          header: "Productos",
          cell: (row: OrdenCompraRow) => (
            <CustodioTableCellText
              text={productosOrdenTablaResumen(row)}
              title={nombresProductosOrden(row)}
              className="font-medium"
            />
          ),
          headerClassName: custodioOrdenCompraColumnClass("productos"),
          cellClassName: custodioOrdenCompraColumnClass("productos"),
        },
      ] as const,
    [],
  );

  return (
    <CustodioTabPageShell
      activeTab="orden-compra"
      subtitle="Consulta de órdenes de compra de la bodega activa."
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
          emptyMessage="Sin órdenes de compra registradas."
          getRowKey={(row) => row.id_orden_compra}
          tableClassName={CUSTODIO_ORDEN_COMPRA_TABLE_MIN_WIDTH_CLASS}
        />
      )}
    </CustodioTabPageShell>
  );
}
