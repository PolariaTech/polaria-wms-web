/** REQ-180: soft-lock y presencia al editar una orden de venta. */

/**
 * Sin heartbeat (pestaña cerrada a lo bruto), el lock caduca.
 * La salida normal libera al instante; esto es solo red de seguridad.
 */
export const OV_EDIT_LOCK_STALE_MS = 90 * 1000;

/** Intervalo de refresco de `edit_locked_at` mientras el modal está abierto. */
export const OV_EDIT_LOCK_HEARTBEAT_MS = 30 * 1000;

/** Poll del listado para ver quién entró a una OV sin recargar la página. */
export const OV_EDIT_PRESENCE_POLL_MS = 4_000;

export type OvEditLockSnapshot = {
  editLockedBy: string | null;
  editLockedAt: string | null;
  editLockedNombre: string | null;
};


export type OvEditLockMode = "edit" | "soloLectura";

export type OvEditLockDecision = {
  mode: OvEditLockMode;
  holderNombre: string | null;
  holderId: string | null;
};

/** Iniciales tipo Sheets (1–2 letras) a partir del nombre visible. */
export function initialsFromNombre(nombre: string): string {
  const parts = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return (parts[0]!.charAt(0) || "?").toUpperCase();
  }
  return (
    (parts[0]!.charAt(0) || "") + (parts[1]!.charAt(0) || "")
  ).toUpperCase() || "?";
}

export function isOvEditLockStale(
  lockedAt: string | null | undefined,
  nowMs: number = Date.now(),
  staleMs: number = OV_EDIT_LOCK_STALE_MS,
): boolean {
  if (!lockedAt?.trim()) return true;
  const ts = Date.parse(lockedAt);
  if (!Number.isFinite(ts)) return true;
  return nowMs - ts >= staleMs;
}

/**
 * ¿Hay un editor activo distinto de `viewerId`?
 * Lock propio o caducado → no bloquea.
 */
export function hasActiveForeignOvEditLock(
  snap: OvEditLockSnapshot,
  viewerId: string,
  nowMs: number = Date.now(),
): boolean {
  const holder = snap.editLockedBy?.trim() || "";
  if (!holder) return false;
  if (holder === viewerId.trim()) return false;
  return !isOvEditLockStale(snap.editLockedAt, nowMs);
}

export function decideOvEditLockMode(
  snap: OvEditLockSnapshot,
  viewerId: string,
  nowMs: number = Date.now(),
): OvEditLockDecision {
  if (hasActiveForeignOvEditLock(snap, viewerId, nowMs)) {
    return {
      mode: "soloLectura",
      holderId: snap.editLockedBy,
      holderNombre: snap.editLockedNombre?.trim() || "Otro usuario",
    };
  }
  return {
    mode: "edit",
    holderId: viewerId.trim() || null,
    holderNombre: null,
  };
}
