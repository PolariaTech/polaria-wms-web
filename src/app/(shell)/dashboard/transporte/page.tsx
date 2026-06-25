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
  listEvidenciasTransporte,
  listGuiasEnvio,
} from "@/modules/transport";

const TRANSPORTE_ROLES = [
  WmsRol.transportista,
  ...ROLES_NIVEL_CUENTA,
  WmsRol.administrador_bodega,
  WmsRol.jefe_bodega,
] as const;

function TransporteModuleContent() {
  const loadGuias = useCallback(
    (params: { codigoCuenta: string; idBodega: string | null }) =>
      listGuiasEnvio({
        codigoCuenta: params.codigoCuenta,
        idBodega: params.idBodega,
      }),
    [],
  );

  const loadEvidencias = useCallback(
    (params: { codigoCuenta: string; idBodega: string | null }) =>
      listEvidenciasTransporte({
        codigoCuenta: params.codigoCuenta,
      }),
    [],
  );

  const guias = useTenantList(loadGuias);
  const evidencias = useTenantList(loadEvidencias);

  return (
    <div className="flex flex-col gap-8">
      <ModuleListPage
        sectionTitle="Guías de envío"
        isLoading={guias.isLoading}
        error={guias.error}
        rows={guias.rows}
        emptyMessage="Sin guías de envío registradas."
        getRowKey={(row) => row.id_guia}
        columns={[
          { id: "codigo", header: "Código", cell: (row) => row.codigo },
          {
            id: "estado",
            header: "Estado",
            cell: (row) => row.estado,
            cellClassName: "text-polaria-w-50",
          },
          { id: "destino", header: "Destino", cell: (row) => row.destino },
          {
            id: "created",
            header: "Creada",
            cell: (row) => formatDateTime(row.created_at),
            cellClassName: "text-polaria-w-50",
          },
        ]}
      />

      <ModuleListPage
        sectionTitle="Evidencias de transporte"
        isLoading={evidencias.isLoading}
        error={evidencias.error}
        rows={evidencias.rows}
        emptyMessage="Sin evidencias de entrega registradas."
        getRowKey={(row) => row.id_evidencia}
        columns={[
          {
            id: "guia",
            header: "Guía",
            cell: (row) => row.id_guia,
            cellClassName: "font-mono text-xs",
          },
          {
            id: "tipo",
            header: "Tipo",
            cell: (row) => row.tipo,
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "conforme",
            header: "Conforme",
            cell: (row) =>
              row.entrega_conforme === null
                ? "—"
                : row.entrega_conforme
                  ? "Sí"
                  : "No",
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

export default function DashboardTransportePage() {
  return (
    <OperationalModuleShell
      title="Transporte"
      description="Guías de envío y evidencias de entrega."
      gate={{
        module: WMS_MODULE.TRANSPORT,
        roles: TRANSPORTE_ROLES,
      }}
    >
      <TransporteModuleContent />
    </OperationalModuleShell>
  );
}
