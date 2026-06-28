"use client";

import { useCallback } from "react";
import { ModuleListPage } from "@/components/shared/ModuleListPage";
import { formatDateTime } from "@/components/shared/formatters";
import { useTenantList } from "@/hooks/useTenantList";
import { listRecepciones } from "../services/purchases.service";

export function IngresoPageContent() {
  const loadRecepciones = useCallback(
    (params: { codigoCuenta: string; idBodega: string | null }) =>
      listRecepciones({
        codigoCuenta: params.codigoCuenta,
        idBodega: params.idBodega,
      }),
    [],
  );

  const recepciones = useTenantList(loadRecepciones);

  return (
    <ModuleListPage
      sectionTitle="Recepciones de compra"
      isLoading={recepciones.isLoading}
      error={recepciones.error}
      rows={recepciones.rows}
      emptyMessage="Sin recepciones registradas."
      getRowKey={(row) => row.id_recepcion}
      columns={[
        {
          id: "orden",
          header: "Orden compra",
          cell: (row) => row.id_orden_compra,
          cellClassName: "font-mono text-xs",
        },
        {
          id: "diferencias",
          header: "Sin diferencias",
          cell: (row) => (row.sin_diferencias ? "Sí" : "No"),
        },
        {
          id: "cerrada",
          header: "Cerrada",
          cell: (row) => formatDateTime(row.cerrada_at),
          cellClassName: "text-polaria-w-50",
        },
        {
          id: "created",
          header: "Registro",
          cell: (row) => formatDateTime(row.created_at),
          cellClassName: "text-polaria-w-50",
        },
      ]}
    />
  );
}
