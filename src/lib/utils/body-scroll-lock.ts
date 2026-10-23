/**
 * Lock de scroll del `body` con contador.
 * Evita el bug de modales anidados: cada uno guardaba el overflow previo
 * y al cerrar el último podía dejar `overflow: hidden` para siempre (F5).
 */

let lockCount = 0;
let previousOverflow: string | null = null;

export function lockBodyScroll(): void {
  if (typeof document === "undefined") return;

  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

export function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (lockCount === 0) return;

  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow ?? "";
    previousOverflow = null;
  }
}

/**
 * Libera el scroll de página sí o sí (p. ej. al cambiar de ruta).
 * Los overlays deberían desmontarse; esto evita un `hidden` huérfano.
 */
export function forceResetBodyScrollLock(): void {
  lockCount = 0;
  previousOverflow = null;
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
}

/** @deprecated Usar forceResetBodyScrollLock. */
export const resetBodyScrollLockForTests = forceResetBodyScrollLock;

/** Solo tests. */
export function getBodyScrollLockCountForTests(): number {
  return lockCount;
}
