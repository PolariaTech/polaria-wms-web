"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useVisibleInterval } from "@/hooks/shared/useVisibleInterval";
import { listOvEditLocks } from "../services/ov-edit-lock.service";
import {
  OV_EDIT_PRESENCE_POLL_MS,
  type OvEditLockSnapshot,
} from "../utils/pedido/ov-edit-lock";

/**
 * REQ-180: el Realtime solo publica `public.orden_venta`, pero el lock vive en emp_*.
 * Poll corto para que el avatar aparezca/desaparezca en segundos sin F5.
 */
export function useOvEditPresencePoll(params: {
  codigoCuenta: string | null | undefined;
  ids: readonly string[];
  enabled?: boolean;
}): Record<string, OvEditLockSnapshot> {
  const [byId, setById] = useState<Record<string, OvEditLockSnapshot>>({});
  const codigoCuenta = params.codigoCuenta?.trim() || "";
  const idsKey = useMemo(
    () =>
      [...new Set(params.ids.map((id) => id.trim()).filter(Boolean))]
        .sort()
        .join(","),
    [params.ids],
  );
  const enabled = Boolean(params.enabled !== false && codigoCuenta && idsKey);

  const tick = useCallback(() => {
    if (!codigoCuenta || !idsKey) return;
    const ids = idsKey.split(",");
    void listOvEditLocks({ codigoCuenta, ids })
      .then((next) => setById(next))
      .catch(() => {
        /* presencia best-effort */
      });
  }, [codigoCuenta, idsKey]);

  useEffect(() => {
    if (!enabled) {
      setById({});
      return;
    }
    tick();
  }, [enabled, tick]);

  useVisibleInterval(tick, OV_EDIT_PRESENCE_POLL_MS, enabled);

  return byId;
}

export function mergeOvEditPresence<T extends {
  idOrdenVenta: string;
  editLockedBy?: string | null;
  editLockedAt?: string | null;
  editLockedNombre?: string | null;
}>(
  rows: readonly T[],
  presenceById: Record<string, OvEditLockSnapshot>,
): T[] {
  if (Object.keys(presenceById).length === 0) return [...rows];
  return rows.map((row) => {
    const snap = presenceById[row.idOrdenVenta];
    if (!snap) return row;
    return {
      ...row,
      editLockedBy: snap.editLockedBy,
      editLockedAt: snap.editLockedAt,
      editLockedNombre: snap.editLockedNombre,
    };
  });
}
