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
import {
  completarTareaColaApi,
  crearLlamadaJefeApi,
  listAlertasOperativasApi,
} from "@/modules/operations";
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
  const [isMutating, setIsMutating] = useState(false);

  const fetchTareas = useCallback(
    () =>
      listTareasOperarioABodega({
        codigoCuenta,
        idBodega: activeBodegaId,
        idUsuario,
      }),
    [activeBodegaId, codigoCuenta, idUsuario],
  );

  const { data, isLoading, error, reload } = useAsyncQuery(
    fetchTareas,
    Boolean(codigoCuenta && activeBodegaId && idUsuario),
  );

  const handleCompletarTarea = useCallback(
    async (idTarea: string) => {
      if (!codigoCuenta || !activeBodegaId) return;
      setIsMutating(true);
      setActionNotice(null);
      try {
        await completarTareaColaApi(idTarea, {
          codigoCuenta,
          idBodega: activeBodegaId,
        });
        setActionNotice("Tarea completada.");
        await reload();
      } catch (err) {
        setActionNotice(
          err instanceof Error ? err.message : "No se pudo completar la tarea.",
        );
      } finally {
        setIsMutating(false);
      }
    },
    [activeBodegaId, codigoCuenta, reload],
  );

  const handleLlamarJefe = useCallback(async () => {
    if (!codigoCuenta || !activeBodegaId) return;
    setIsMutating(true);
    setActionNotice(null);
    try {
      await crearLlamadaJefeApi({ codigoCuenta, idBodega: activeBodegaId });
      setActionNotice("Llamada enviada al jefe de bodega.");
    } catch (err) {
      setActionNotice(
        err instanceof Error ? err.message : "No se pudo llamar al jefe.",
      );
    } finally {
      setIsMutating(false);
    }
  }, [activeBodegaId, codigoCuenta]);

  const handleVerAlertas = useCallback(async () => {
    if (!codigoCuenta || !activeBodegaId) return;
    setIsMutating(true);
    setActionNotice(null);
    try {
      const alertas = await listAlertasOperativasApi({
        codigoCuenta,
        idBodega: activeBodegaId,
        estado: "abierta",
      });
      const asignadas = alertas.filter((a) => a.idResponsable === idUsuario);
      setActionNotice(
        asignadas.length > 0
          ? `Tienes ${asignadas.length} alerta(s) asignada(s).`
          : "No tienes alertas asignadas.",
      );
    } catch (err) {
      setActionNotice(
        err instanceof Error ? err.message : "No se pudieron cargar alertas.",
      );
    } finally {
      setIsMutating(false);
    }
  }, [activeBodegaId, codigoCuenta, idUsuario]);

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
            onClick={
              isMutating
                ? undefined
                : () => void handleCompletarTarea(tarea.id_tarea)
            }
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
            void handleVerAlertas();
          },
        },
        {
          id: "llamar",
          label: "Llamar",
          icon: Phone,
          tone: "warning",
          onClick: () => {
            void handleLlamarJefe();
          },
          disabled: isMutating,
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
