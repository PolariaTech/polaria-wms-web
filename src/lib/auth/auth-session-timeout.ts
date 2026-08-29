/** Duración máxima de una sesión WMS: 12 horas desde el login (o SSO). */
export const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

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
