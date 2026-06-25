"use client";

import { useCallback } from "react";
import { WMS_MODULE } from "@/constants/permissions";
import {
  ROLES_NIVEL_CUENTA,
  WmsRol,
} from "@/constants/roles";
import { ModuleListPage } from "@/components/shared/ModuleListPage";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { formatDateTime } from "@/components/shared/formatters";
import { useTenantList } from "@/hooks/useTenantList";
import {
  listSolicitudesProcesamiento,
  listTareasCola,
} from "@/modules/processing";

const PROCESAMIENTO_ROLES = [
  WmsRol.procesador,
  ...ROLES_NIVEL_CUENTA,
  WmsRol.administrador_bodega,
  WmsRol.jefe_bodega,
] as const;

function ProcesamientoModuleContent() {
  const loadSolicitudes = useCallback(
    (params: { codigoCuenta: string; idBodega: string | null }) =>
      listSolicitudesProcesamiento({
        codigoCuenta: params.codigoCuenta,
        idBodega: params.idBodega,
      }),
    [],
  );

  const loadTareas = useCallback(
    (params: { codigoCuenta: string; idBodega: string | null }) =>
      listTareasCola({
        codigoCuenta: params.codigoCuenta,
        idBodega: params.idBodega,
      }),
    [],
  );

  const solicitudes = useTenantList(loadSolicitudes);
  const tareas = useTenantList(loadTareas);

  return (
    <div className="flex flex-col gap-8">
      <ModuleListPage
        sectionTitle="Solicitudes de procesamiento"
        isLoading={solicitudes.isLoading}
        error={solicitudes.error}
        rows={solicitudes.rows}
        emptyMessage="Sin solicitudes de procesamiento."
        getRowKey={(row) => row.id_solicitud_procesamiento}
        columns={[
          { id: "codigo", header: "Código", cell: (row) => row.codigo },
          {
            id: "estado",
            header: "Estado",
            cell: (row) => row.estado,
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "producto",
            header: "Producto",
            cell: (row) => row.id_producto_primario,
            cellClassName: "font-mono text-xs",
          },
          {
            id: "updated",
            header: "Actualizado",
            cell: (row) => formatDateTime(row.updated_at),
            cellClassName: "text-polaria-w-50",
          },
        ]}
      />

      <ModuleListPage
        sectionTitle="Tareas en cola"
        isLoading={tareas.isLoading}
        error={tareas.error}
        rows={tareas.rows}
        emptyMessage="Sin tareas en cola para esta bodega."
        getRowKey={(row) => row.id_tarea}
        columns={[
          {
            id: "tipo",
            header: "Tipo",
            cell: (row) => row.tipo,
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "estado",
            header: "Estado",
            cell: (row) => row.estado,
          },
          {
            id: "titulo",
            header: "Título",
            cell: (row) => row.titulo ?? "—",
          },
          {
            id: "updated",
            header: "Actualizado",
            cell: (row) => formatDateTime(row.updated_at),
            cellClassName: "text-polaria-w-50",
          },
        ]}
      />
    </div>
  );
}

export default function DashboardProcesamientoPage() {
  return (
    <OperationalModuleShell
      title="Procesamiento"
      description="Solicitudes de transformación y tareas operativas en cola."
      gate={{
        module: WMS_MODULE.PROCESSING,
        roles: PROCESAMIENTO_ROLES,
      }}
    >
      <ProcesamientoModuleContent />
    </OperationalModuleShell>
  );
}
