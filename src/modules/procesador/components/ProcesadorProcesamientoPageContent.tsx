"use client";

import { useCallback, useState } from "react";
import { AlertCircle, Box, Cpu, Phone } from "lucide-react";
import { usePolariaToast } from "@/components/shared/toast/PolariaToastProvider";
import {
  PolariaRequestActionBar,
  PolariaRequestPageLayout,
  PolariaRequestPanel,
} from "@/components/shared/requests";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import {
  crearLlamadaJefeApi,
  listAlertasOperativasApi,
} from "@/modules/operations";
import { listSolicitudesProcesamientoOperador } from "@/modules/processing";
import type { SolicitudProcesamientoOperadorRow } from "@/modules/processing";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import {
  formatProcesadorTareasCount,
  PROCESADOR_OPERACION_EMPTY_HINT,
  PROCESADOR_OPERACION_EMPTY_MESSAGE,
  PROCESADOR_OPERACION_PAGE_HINT,
  PROCESADOR_OPERACION_PAGE_TITLE,
  PROCESADOR_OPERACION_PANEL_PROCESAR,
  PROCESADOR_OPERACION_PANEL_VACIO,
} from "../constants/procesador-procesamiento";
import { ProcesadorCerrarModal } from "./ProcesadorCerrarModal";
import { ProcesadorSolicitudCard } from "./ProcesadorSolicitudCard";

/**
 * Vista de operación del procesador (referencia frio RequestsQueue + rol procesador):
 * mismo layout que operario, cola de órdenes en_proceso de la bodega.
 */
export function ProcesadorOperacionPageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const idUsuario = useAuthStore((state) => state.session?.idUsuario ?? null);
  const { showToast } = usePolariaToast();
  const [isMutating, setIsMutating] = useState(false);
  const [cerrarTarget, setCerrarTarget] =
    useState<SolicitudProcesamientoOperadorRow | null>(null);

  const fetchSolicitudes = useCallback(async () => {
    if (!codigoCuenta) return [];

    const rows = await listSolicitudesProcesamientoOperador({
      codigoCuenta,
      idBodega: activeBodegaId,
    });

    /** Pool de la bodega en curso (frio: faseCola en_curso, sin filtrar por uid). */
    return rows.filter((row) => row.estado === "en_proceso");
  }, [activeBodegaId, codigoCuenta]);

  const { data, isLoading, error, reload } = useAsyncQuery(
    fetchSolicitudes,
    Boolean(codigoCuenta && activeBodegaId),
  );

  const solicitudes = data ?? [];
  const tieneTareas = solicitudes.length > 0;
  const deshabilitarBandejaYLlamar = tieneTareas;

  const handleLlamarJefe = useCallback(async () => {
    if (!codigoCuenta || !activeBodegaId || deshabilitarBandejaYLlamar) return;
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
  }, [activeBodegaId, codigoCuenta, deshabilitarBandejaYLlamar, showToast]);

  const handleVerAlertas = useCallback(async () => {
    if (!codigoCuenta || !activeBodegaId || deshabilitarBandejaYLlamar) return;
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
  }, [
    activeBodegaId,
    codigoCuenta,
    deshabilitarBandejaYLlamar,
    idUsuario,
    showToast,
  ]);

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
          disabled: deshabilitarBandejaYLlamar,
        },
        {
          id: "llamar",
          label: "Llamar",
          icon: Phone,
          tone: "warning",
          onClick: () => {
            void handleLlamarJefe();
          },
          disabled: isMutating || deshabilitarBandejaYLlamar,
        },
      ]}
    />
  );

  return (
    <>
      <PolariaRequestPageLayout
        title={PROCESADOR_OPERACION_PAGE_TITLE}
        hint={PROCESADOR_OPERACION_PAGE_HINT}
      >
        {!codigoCuenta || !activeBodegaId ? (
          <p className="polaria-text-body-sm text-polaria-w-50">
            Selecciona una bodega activa para ver tu operación en bodega.
          </p>
        ) : (
          <PolariaRequestPanel
            title={
              tieneTareas
                ? PROCESADOR_OPERACION_PANEL_PROCESAR
                : PROCESADOR_OPERACION_PANEL_VACIO
            }
            icon={tieneTareas ? Cpu : Box}
            pendingCount={solicitudes.length}
            totalCount={solicitudes.length}
            formatTotalCount={formatProcesadorTareasCount}
            showPendingStatus={tieneTareas}
            isLoading={isLoading}
            error={error}
            emptyMessage={PROCESADOR_OPERACION_EMPTY_MESSAGE}
            emptyHint={PROCESADOR_OPERACION_EMPTY_HINT}
            footer={actionBar}
          >
            {solicitudes.length > 0
              ? solicitudes.map((solicitud) => (
                  <ProcesadorSolicitudCard
                    key={solicitud.idSolicitudProcesamiento}
                    solicitud={solicitud}
                    disabled={isMutating}
                    onSelect={setCerrarTarget}
                  />
                ))
              : null}
          </PolariaRequestPanel>
        )}
      </PolariaRequestPageLayout>

      <ProcesadorCerrarModal
        open={Boolean(cerrarTarget)}
        onClose={() => setCerrarTarget(null)}
        solicitud={cerrarTarget}
        codigoCuenta={codigoCuenta}
        idBodega={activeBodegaId}
        onClosed={() => {
          void reload();
        }}
      />
    </>
  );
}

/** @deprecated Usar ProcesadorOperacionPageContent */
export const ProcesadorProcesamientoPageContent = ProcesadorOperacionPageContent;
