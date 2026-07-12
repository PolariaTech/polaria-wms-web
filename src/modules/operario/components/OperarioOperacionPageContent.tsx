"use client";

import { useCallback, useState } from "react";
import { AlertCircle, Box, Phone } from "lucide-react";
import { usePolariaToast } from "@/components/shared/toast/PolariaToastProvider";
import {
  PolariaRequestActionBar,
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
  OPERARIO_A_BODEGA_EMPTY_HINT,
  OPERARIO_A_BODEGA_EMPTY_MESSAGE,
  OPERARIO_A_BODEGA_PANEL_TITLE,
  OPERARIO_PAGE_HINT,
  OPERARIO_PAGE_TITLE,
} from "../constants/operario-a-bodega";
import { listTareasOperarioABodega } from "../services/operario-a-bodega.service";
import { OperarioTareaCard } from "./OperarioTareaCard";

export function OperarioOperacionPageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const idUsuario = useAuthStore((state) => state.session?.idUsuario ?? null);
  const { showToast } = usePolariaToast();
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
      try {
        await completarTareaColaApi(idTarea, {
          codigoCuenta,
          idBodega: activeBodegaId,
        });
        showToast({
          title: "Tarea completada",
          content: "El movimiento se registró en bodega.",
          variant: "success",
          durationMs: 3000,
        });
        await reload();
      } catch (err) {
        showToast({
          title: "No se pudo completar",
          content:
            err instanceof Error ? err.message : "No se pudo completar la tarea.",
          variant: "error",
          durationMs: 3000,
        });
      } finally {
        setIsMutating(false);
      }
    },
    [activeBodegaId, codigoCuenta, reload, showToast],
  );

  const handleLlamarJefe = useCallback(async () => {
    if (!codigoCuenta || !activeBodegaId) return;
    setIsMutating(true);
    try {
      await crearLlamadaJefeApi({ codigoCuenta, idBodega: activeBodegaId });
      showToast({
        title: "Llamada enviada",
        content: "El jefe de bodega fue notificado.",
        variant: "info",
        durationMs: 3000,
      });
    } catch (err) {
      showToast({
        title: "Error",
        content:
          err instanceof Error ? err.message : "No se pudo llamar al jefe.",
        variant: "error",
        durationMs: 3000,
      });
    } finally {
      setIsMutating(false);
    }
  }, [activeBodegaId, codigoCuenta, showToast]);

  const handleVerAlertas = useCallback(async () => {
    if (!codigoCuenta || !activeBodegaId) return;
    setIsMutating(true);
    try {
      const alertas = await listAlertasOperativasApi({
        codigoCuenta,
        idBodega: activeBodegaId,
        estado: "abierta",
      });
      const asignadas = alertas.filter((a) => a.idResponsable === idUsuario);
      showToast({
        title: "Alertas",
        content:
          asignadas.length > 0
            ? `Tienes ${asignadas.length} alerta(s) asignada(s).`
            : "No tienes alertas asignadas.",
        variant: "info",
        durationMs: 3000,
      });
    } catch (err) {
      showToast({
        title: "Error",
        content:
          err instanceof Error ? err.message : "No se pudieron cargar alertas.",
        variant: "error",
        durationMs: 3000,
      });
    } finally {
      setIsMutating(false);
    }
  }, [activeBodegaId, codigoCuenta, idUsuario, showToast]);

  const tareas = data ?? [];
  const tareasCount = tareas.length;
  const pendientesCount = tareasCount;

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
            isLoading={isLoading}
            error={error}
            emptyMessage={OPERARIO_A_BODEGA_EMPTY_MESSAGE}
            emptyHint={OPERARIO_A_BODEGA_EMPTY_HINT}
            footer={actionBar}
          >
            {tareas.length > 0
              ? tareas.map((tarea) => (
                  <OperarioTareaCard
                    key={tarea.id_tarea}
                    tarea={tarea}
                    disabled={isMutating}
                    onComplete={() => void handleCompletarTarea(tarea.id_tarea)}
                  />
                ))
              : null}
          </PolariaRequestPanel>
        </>
      )}
    </PolariaRequestPageLayout>
  );
}

/** @deprecated Usar OperarioOperacionPageContent */
export const OperarioABodegaPageContent = OperarioOperacionPageContent;
