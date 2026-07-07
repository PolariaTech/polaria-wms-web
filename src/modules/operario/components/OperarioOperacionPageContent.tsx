"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, Box, Phone } from "lucide-react";
import {
  PolariaRequestActionBar,
  PolariaRequestInboxItem,
  PolariaRequestPageLayout,
  PolariaRequestPanel,
} from "@/components/shared/requests";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import {
  formatOperarioTareasCount,
  OPERARIO_A_BODEGA_EMPTY_MESSAGE,
  OPERARIO_A_BODEGA_PANEL_TITLE,
  OPERARIO_PAGE_HINT,
  OPERARIO_PAGE_TITLE,
} from "../constants/operario-a-bodega";
import { listTareasOperarioABodega } from "../services/operario-a-bodega.service";

export function OperarioOperacionPageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const idUsuario = useAuthStore((state) => state.session?.idUsuario ?? null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchTareas = useCallback(
    () =>
      listTareasOperarioABodega({
        codigoCuenta,
        idBodega: activeBodegaId,
        idUsuario,
      }),
    [activeBodegaId, codigoCuenta, idUsuario],
  );

  const { data, isLoading, error } = useAsyncQuery(
    fetchTareas,
    Boolean(codigoCuenta && activeBodegaId && idUsuario),
  );

  const tareas = data ?? [];
  const tareasCount = tareas.length;
  const pendientesCount = tareasCount;

  const panelContent = useMemo(() => {
    if (isLoading || error || tareasCount === 0) {
      return null;
    }

    return (
      <div className="flex flex-col gap-3">
        {tareas.map((tarea) => (
          <PolariaRequestInboxItem
            key={tarea.id_tarea}
            title={
              tarea.titulo?.trim() ||
              `Traslado ${tarea.id_tarea.slice(0, 8)}`
            }
            subtitle={tarea.descripcion?.trim() || undefined}
          />
        ))}
      </div>
    );
  }, [error, isLoading, tareas, tareasCount]);

  const actionBar = (
    <PolariaRequestActionBar
      actions={[
        {
          id: "alertas",
          label: "Alertas",
          icon: AlertCircle,
          tone: "teal",
          onClick: () => {
            setActionNotice(
              "Las alertas de bodega estarán disponibles próximamente.",
            );
          },
        },
        {
          id: "llamar",
          label: "Llamar",
          icon: Phone,
          tone: "warning",
          onClick: () => {
            setActionNotice(
              "La llamada al jefe de bodega estará disponible próximamente.",
            );
          },
        },
      ]}
    />
  );

  return (
    <PolariaRequestPageLayout title={OPERARIO_PAGE_TITLE} hint={OPERARIO_PAGE_HINT}>
      {!codigoCuenta || !activeBodegaId ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          Selecciona una bodega activa para ver tu operación en bodega.
        </p>
      ) : (
        <>
          <PolariaRequestPanel
            title={OPERARIO_A_BODEGA_PANEL_TITLE}
            icon={Box}
            pendingCount={pendientesCount}
            totalCount={tareasCount}
            formatTotalCount={formatOperarioTareasCount}
            showPendingStatus
            isLoading={isLoading}
            error={error}
            emptyMessage={OPERARIO_A_BODEGA_EMPTY_MESSAGE}
            footer={actionBar}
          >
            {panelContent}
          </PolariaRequestPanel>

          {actionNotice ? (
            <p
              role="status"
              className="mt-4 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50"
            >
              {actionNotice}
            </p>
          ) : null}
        </>
      )}
    </PolariaRequestPageLayout>
  );
}

/** @deprecated Usar OperarioOperacionPageContent */
export const OperarioABodegaPageContent = OperarioOperacionPageContent;
