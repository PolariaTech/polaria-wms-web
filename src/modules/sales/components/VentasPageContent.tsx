"use client";

import { useCallback } from "react";
import { ModuleListPage } from "@/components/shared/ModuleListPage";
import { formatDateTime } from "@/components/shared/formatters";
import { useTenantList } from "@/hooks/useTenantList";
import { listOrdenesVenta } from "../services/sales.service";

export function VentasPageContent() {
  const loadOrdenes = useCallback(
    (params: { codigoCuenta: string; idBodega: string | null }) =>
      listOrdenesVenta({
        codigoCuenta: params.codigoCuenta,
        idBodega: params.idBodega,
      }),
    [],
  );

  const ordenes = useTenantList(loadOrdenes);

  return (
    <ModuleListPage
      isLoading={ordenes.isLoading}
      error={ordenes.error}
      rows={ordenes.rows}
      emptyMessage="Sin órdenes de venta registradas."
      getRowKey={(row) => row.id_orden_venta}
      columns={[
        { id: "codigo", header: "Código", cell: (row) => row.codigo },
        {
          id: "estado",
          header: "Estado",
          cell: (row) => row.estado,
          cellClassName: "text-polaria-w-50",
        },
        {
          id: "cliente",
          header: "Cliente",
          cell: (row) => row.id_cliente,
          cellClassName: "font-mono text-xs",
        },
        {
          id: "pedido",
          header: "Fecha pedido",
          cell: (row) => formatDateTime(row.fecha_pedido),
          cellClassName: "text-polaria-w-50",
        },
        {
          id: "updated",
          header: "Actualizado",
          cell: (row) => formatDateTime(row.updated_at),
          cellClassName: "text-polaria-w-50",
        },
      ]}
    />
  );
}
