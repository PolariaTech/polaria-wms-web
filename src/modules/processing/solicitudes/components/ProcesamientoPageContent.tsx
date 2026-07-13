"use client";

import { useCallback } from "react";
import { WmsRol } from "@/constants/wms/roles";
import { ModuleListPage } from "@/components/shared/module/ModuleListPage";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { useTenantList } from "@/hooks/shared/useTenantList";
import { ProcesadorOperacionPageContent } from "@/modules/procesador";
import { useAuthStore } from "@/stores/auth.store";
import {
  listSolicitudesProcesamiento,
  listTareasCola,
} from "../../shared/services/processing.service";

export function ProcesamientoPageContent() {
  const idRol = useAuthStore((state) => state.session?.idRol);

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

  if (idRol === WmsRol.procesador) {
    return <ProcesadorOperacionPageContent />;
  }

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
