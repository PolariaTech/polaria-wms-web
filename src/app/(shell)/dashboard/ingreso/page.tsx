"use client";

import { useCallback } from "react";
import { ModuleListPage } from "@/components/shared/ModuleListPage";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { formatDateTime } from "@/components/shared/formatters";
import { useTenantList } from "@/hooks/useTenantList";
import {
  listOrdenesCompra,
  listRecepciones,
  listSolicitudesCompra,
} from "@/modules/purchases";

function IngresoModuleContent() {
  const loadSolicitudes = useCallback(
    (params: { codigoCuenta: string; idBodega: string | null }) =>
      listSolicitudesCompra({
        codigoCuenta: params.codigoCuenta,
        idBodega: params.idBodega,
      }),
    [],
  );

  const loadOrdenes = useCallback(
    (params: { codigoCuenta: string; idBodega: string | null }) =>
      listOrdenesCompra({
        codigoCuenta: params.codigoCuenta,
        idBodega: params.idBodega,
      }),
    [],
  );

  const loadRecepciones = useCallback(
    (params: { codigoCuenta: string; idBodega: string | null }) =>
      listRecepciones({
        codigoCuenta: params.codigoCuenta,
        idBodega: params.idBodega,
      }),
    [],
  );

  const solicitudes = useTenantList(loadSolicitudes);
  const ordenes = useTenantList(loadOrdenes);
  const recepciones = useTenantList(loadRecepciones);

  return (
    <div className="flex flex-col gap-8">
      <ModuleListPage
        sectionTitle="Solicitudes de compra"
        isLoading={solicitudes.isLoading}
        error={solicitudes.error}
        rows={solicitudes.rows}
        emptyMessage="Sin solicitudes de compra registradas."
        getRowKey={(row) => row.id_solicitud_compra}
        columns={[
          { id: "codigo", header: "Código", cell: (row) => row.codigo },
          {
            id: "estado",
            header: "Estado",
            cell: (row) => row.estado,
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "bodega",
            header: "Bodega",
            cell: (row) => row.id_bodega,
            cellClassName: "font-mono text-xs",
          },
          {
            id: "created",
            header: "Creada",
            cell: (row) => formatDateTime(row.created_at),
            cellClassName: "text-polaria-w-50",
          },
        ]}
      />

      <ModuleListPage
        sectionTitle="Órdenes de compra"
        isLoading={ordenes.isLoading}
        error={ordenes.error}
        rows={ordenes.rows}
        emptyMessage="Sin órdenes de compra registradas."
        getRowKey={(row) => row.id_orden_compra}
        columns={[
          { id: "codigo", header: "Código", cell: (row) => row.codigo },
          {
            id: "estado",
            header: "Estado",
            cell: (row) => row.estado,
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "proveedor",
            header: "Proveedor",
            cell: (row) => row.id_proveedor,
            cellClassName: "font-mono text-xs",
          },
          {
            id: "emision",
            header: "Emisión",
            cell: (row) => formatDateTime(row.fecha_emision),
            cellClassName: "text-polaria-w-50",
          },
        ]}
      />

      <ModuleListPage
        sectionTitle="Recepciones"
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
    </div>
  );
}

export default function DashboardIngresoPage() {
  return (
    <OperationalModuleShell
      title="Ingreso"
      description="Solicitudes, órdenes y recepciones de compra de la cuenta activa."
      gate={{ minNivelRol: "bodega" }}
    >
      <IngresoModuleContent />
    </OperationalModuleShell>
  );
}
