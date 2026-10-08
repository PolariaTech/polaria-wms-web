/**
 * Duración máxima de una sesión WMS: 7 días desde el login (o SSO).
 * Alineado al máximo de JWT expiry de Supabase (604800 s).
 */
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

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
