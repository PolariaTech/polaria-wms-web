import { useCallback, useEffect, useRef } from "react";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useVisibleInterval } from "@/hooks/shared/useVisibleInterval";
import { useCuentaZonaHoraria } from "@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria";
import { useOrdenesVentaSubscription } from "../../shared/hooks/useOrdenesVentaSubscription";
import type { OrdenVentaRealtimePostgresPayload } from "../../shared/hooks/ordenes-venta-realtime.types";
import {
  getOrdenVentaOperadorById,
  listOrdenesVentaOperador,
} from "../../shared/services/sales.service";
import type {
  OrdenesVentaPageData,
  RunScoped,
} from "../components/pages/ov-impresion-feedback";
import { listOrdenIdsCorreoNoEnviado } from "../print/list-orden-ids-correo-no-enviado";
import { listOrdenIdsConSurtidoCaptura } from "../surtido/list-orden-ids-con-surtido-captura";
import { applyOrdenVentaRealtimePatch } from "./apply-ordenes-venta-realtime-patch";
import { resolveOrdenVentaRealtimeAction } from "./resolve-ordenes-venta-realtime-action";

/** Intervalo de la red de seguridad por si un cambio realtime no llega. */
export const INTERVALO_RECARGA_LISTADO_MS = 90_000;

const DEBOUNCE_RECARGA_COMPLETA_MS = 250;

async function cargarIdsAuxiliares(params: {
  codigoCuenta: string;
  idOrdenes: string[];
  runScoped: RunScoped;
}): Promise<Pick<OrdenesVentaPageData, "idsConFotosCaptura" | "idsCorreoNoEnviado">> {
  const { codigoCuenta, idOrdenes, runScoped } = params;
  const [fotosResult, correoResult] = await Promise.allSettled([
    runScoped(() =>
      listOrdenIdsConSurtidoCaptura({ codigoCuenta, idOrdenes }),
    ),
    runScoped(() =>
      listOrdenIdsCorreoNoEnviado({ codigoCuenta, idOrdenes }),
    ),
  ]);

  return {
    idsConFotosCaptura:
      fotosResult.status === "fulfilled" ? fotosResult.value : new Set(),
    idsCorreoNoEnviado:
      correoResult.status === "fulfilled" ? correoResult.value : new Set(),
  };
}

/** Carga el listado de OV del operador y lo mantiene al día (realtime + intervalo). */
export function useOrdenesVentaListadoData({
  codigoCuenta,
  runScoped,
}: {
  codigoCuenta: string | null;
  runScoped: RunScoped;
}) {
  const fetchOrdenes = useCallback(async (): Promise<OrdenesVentaPageData> => {
    if (!codigoCuenta) {
      return { rows: [], idsConFotosCaptura: new Set(), idsCorreoNoEnviado: new Set() };
    }

    const rows = await runScoped(() =>
      listOrdenesVentaOperador({ codigoCuenta }),
    );
    const idOrdenes = rows.map((row) => row.idOrdenVenta);
    const auxiliares = await cargarIdsAuxiliares({
      codigoCuenta,
      idOrdenes,
      runScoped,
    });
    return { rows, ...auxiliares };
  }, [codigoCuenta, runScoped]);

  const { data, isLoading, isRefreshing, error, reload, patchData } =
    useAsyncQuery(fetchOrdenes, Boolean(codigoCuenta));

  const zonaHoraria = useCuentaZonaHoraria(codigoCuenta);

  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeFetchLockRef = useRef(false);

  const scheduleFullReload = useCallback(() => {
    if (reloadTimerRef.current) {
      clearTimeout(reloadTimerRef.current);
    }
    reloadTimerRef.current = setTimeout(() => {
      void reload();
    }, DEBOUNCE_RECARGA_COMPLETA_MS);
  }, [reload]);

  const onRealtimePayload = useCallback(
    (payload: OrdenVentaRealtimePostgresPayload) => {
      if (!codigoCuenta) return;

      const action = resolveOrdenVentaRealtimeAction(payload, codigoCuenta);
      if (action.kind === "ignore") return;

      if (action.kind === "reload") {
        scheduleFullReload();
        return;
      }

      if (action.kind === "patch") {
        patchData((prev) => ({
          ...prev,
          rows: applyOrdenVentaRealtimePatch(prev.rows, action.event),
        }));
        return;
      }

      if (realtimeFetchLockRef.current) {
        scheduleFullReload();
        return;
      }

      realtimeFetchLockRef.current = true;
      void (async () => {
        try {
          const row = await runScoped(() =>
            getOrdenVentaOperadorById({
              codigoCuenta,
              idOrdenVenta: action.idOrdenVenta,
            }),
          );

          if (!row) {
            scheduleFullReload();
            return;
          }

          if (row.estado === "cancelada") {
            patchData((prev) => ({
              ...prev,
              rows: applyOrdenVentaRealtimePatch(prev.rows, {
                type: "remove",
                idOrdenVenta: row.idOrdenVenta,
              }),
            }));
            return;
          }

          patchData((prev) => ({
            ...prev,
            rows: applyOrdenVentaRealtimePatch(prev.rows, {
              type: "upsert",
              row,
            }),
          }));
        } catch {
          scheduleFullReload();
        } finally {
          realtimeFetchLockRef.current = false;
        }
      })();
    },
    [codigoCuenta, patchData, runScoped, scheduleFullReload],
  );

  useOrdenesVentaSubscription(codigoCuenta, onRealtimePayload);

  /** Red de seguridad: si un cambio no llega al instante, se alinea en ~90 s. */
  useVisibleInterval(
    () => {
      void reload();
    },
    INTERVALO_RECARGA_LISTADO_MS,
    Boolean(codigoCuenta),
  );

  useEffect(() => {
    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
    };
  }, []);

  return { data, isLoading, isRefreshing, error, reload, zonaHoraria };
}