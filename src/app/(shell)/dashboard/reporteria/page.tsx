"use client";

import { useCallback } from "react";
import { WMS_MODULE } from "@/constants/permissions";
import { ModuleListPage } from "@/components/shared/ModuleListPage";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { formatDateTime } from "@/components/shared/formatters";
import { useTenantList } from "@/hooks/useTenantList";
import { listAuditoriaOperacion } from "@/modules/audit";

function ReporteriaModuleContent() {
  const loadAuditoria = useCallback(
    (params: { codigoCuenta: string; idBodega: string | null }) =>
      listAuditoriaOperacion({
        codigoCuenta: params.codigoCuenta,
        idBodega: params.idBodega,
      }),
    [],
  );

  const auditoria = useTenantList(loadAuditoria);

  return (
    <ModuleListPage
      isLoading={auditoria.isLoading}
      error={auditoria.error}
      rows={auditoria.rows}
      emptyMessage="Sin registros de auditoría recientes."
      getRowKey={(row) => row.id_auditoria}
      columns={[
        {
          id: "accion",
          header: "Acción",
          cell: (row) => row.accion,
        },
        {
          id: "entidad",
          header: "Entidad",
          cell: (row) => row.entidad,
          cellClassName: "font-mono text-xs",
        },
        {
          id: "usuario",
          header: "Usuario",
          cell: (row) => row.id_usuario ?? "—",
          cellClassName: "text-polaria-w-50",
        },
        {
          id: "bodega",
          header: "Bodega",
          cell: (row) => row.id_bodega ?? "—",
          cellClassName: "text-polaria-w-50",
        },
        {
          id: "created",
          header: "Fecha",
          cell: (row) => formatDateTime(row.created_at),
          cellClassName: "text-polaria-w-50",
        },
      ]}
    />
  );
}

export default function DashboardReporteriaPage() {
  return (
    <OperationalModuleShell
      title="Reportería"
      description="Auditoría operativa reciente del tenant (lectura limitada)."
      gate={{ module: WMS_MODULE.AUDIT }}
    >
      <ReporteriaModuleContent />
    </OperationalModuleShell>
  );
}
