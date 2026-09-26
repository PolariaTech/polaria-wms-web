/**
 * Duración máxima de una sesión WMS: 23 días desde el login (o SSO).
 * Debe quedar bajo el tope de setTimeout del navegador (~24.8 días / 2^31-1 ms).
 */
export const SESSION_MAX_AGE_MS = 23 * 24 * 60 * 60 * 1000;

export function isSessionExpired(
  sessionStartedAt: number | null | undefined,
  now: number = Date.now(),
): boolean {
  if (sessionStartedAt == null || !Number.isFinite(sessionStartedAt)) {
    return true;
  }

  return now - sessionStartedAt >= SESSION_MAX_AGE_MS;
}

export function getSessionRemainingMs(
  sessionStartedAt: number | null | undefined,
  now: number = Date.now(),
): number {
  if (isSessionExpired(sessionStartedAt, now)) return 0;
  return sessionStartedAt! + SESSION_MAX_AGE_MS - now;
}
