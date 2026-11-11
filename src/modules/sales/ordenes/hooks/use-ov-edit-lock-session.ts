"use client";

import { useCallback, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { releaseOvEditLock } from "../services/ov-edit-lock.service";
import { abrirEdicionOvConLock } from "../utils/pedido/abrir-edicion-ov-con-lock";
import { useOvEditLockHeartbeat } from "./use-ov-edit-lock-heartbeat";

/** REQ-180: soft-lock al abrir/cerrar el formulario de OV. */
export function useOvEditLockSession(params: {
  codigoCuenta: string | null | undefined;
  isCreateOpen: boolean;
  editingId: string | null;
  inspect: boolean;
}) {
  const [soloLectura, setSoloLectura] = useState(false);
  const [holderNombre, setHolderNombre] = useState<string | null>(null);
  const idUsuario = useAuthStore((s) => s.session?.idUsuario) ?? null;

  useOvEditLockHeartbeat({
    active:
      !params.inspect &&
      params.isCreateOpen &&
      Boolean(params.editingId) &&
      !soloLectura,
    codigoCuenta: params.codigoCuenta,
    idOrdenVenta: params.editingId,
    idUsuario,
  });

  const resetLockUi = useCallback(() => {
    setSoloLectura(false);
    setHolderNombre(null);
  }, []);

  /** Libera el soft-lock de esta OV (salida normal del formulario). */
  const releaseCurrent = useCallback(
    async (idOrdenVenta: string | null | undefined) => {
      const id = idOrdenVenta?.trim() || "";
      const cuenta = params.codigoCuenta?.trim() || "";
      const user = idUsuario?.trim() || "";
      if (!id || !cuenta || !user || soloLectura) return;
      try {
        await releaseOvEditLock({
          codigoCuenta: cuenta,
          idOrdenVenta: id,
          idUsuario: user,
        });
      } catch {
        /* best-effort */
      }
    },
    [params.codigoCuenta, idUsuario, soloLectura],
  );

  const prepareOpenEdit = useCallback(
    async (idOrdenVenta: string) => {
      const session = useAuthStore.getState().session;
      const apertura = await abrirEdicionOvConLock({
        codigoCuenta: params.codigoCuenta?.trim() || "",
        idOrdenVenta,
        idUsuario: session?.idUsuario,
        nombreUsuario: session?.nombre,
      });
      setSoloLectura(apertura.soloLectura);
      setHolderNombre(apertura.holderNombre);
      return apertura;
    },
    [params.codigoCuenta],
  );

  return {
    soloLectura,
    holderNombre,
    resetLockUi,
    releaseCurrent,
    prepareOpenEdit,
  };
}
