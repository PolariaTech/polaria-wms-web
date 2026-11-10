"use client";

import { useEffect } from "react";
import { useVisibleInterval } from "@/hooks/shared/useVisibleInterval";
import {
  heartbeatOvEditLock,
  releaseOvEditLock,
} from "../services/ov-edit-lock.service";
import { OV_EDIT_LOCK_HEARTBEAT_MS } from "../utils/pedido/ov-edit-lock";

/**
 * Mientras el modal está en modo edición, mantiene vivo el soft-lock
 * y lo libera al desmontar / cerrar.
 */
export function useOvEditLockHeartbeat(params: {
  active: boolean;
  codigoCuenta: string | null | undefined;
  idOrdenVenta: string | null | undefined;
  idUsuario: string | null | undefined;
}): void {
  const codigoCuenta = params.codigoCuenta?.trim() || "";
  const idOrdenVenta = params.idOrdenVenta?.trim() || "";
  const idUsuario = params.idUsuario?.trim() || "";
  const enabled =
    params.active && Boolean(codigoCuenta && idOrdenVenta && idUsuario);

  useVisibleInterval(
    () => {
      if (!codigoCuenta || !idOrdenVenta || !idUsuario) return;
      void heartbeatOvEditLock({ codigoCuenta, idOrdenVenta, idUsuario }).catch(
        () => {
          /* presencia best-effort */
        },
      );
    },
    OV_EDIT_LOCK_HEARTBEAT_MS,
    enabled,
  );

  useEffect(() => {
    if (!enabled) return;
    const liberar = () => {
      void releaseOvEditLock({ codigoCuenta, idOrdenVenta, idUsuario }).catch(
        () => {
          /* best-effort */
        },
      );
    };
    // pagehide: cierre de pestaña / refresh (el cleanup de React no siempre alcanza).
    window.addEventListener("pagehide", liberar);
    return () => {
      window.removeEventListener("pagehide", liberar);
      liberar();
    };
  }, [enabled, codigoCuenta, idOrdenVenta, idUsuario]);
}
