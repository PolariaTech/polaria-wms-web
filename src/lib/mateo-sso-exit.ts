/** Evita que AuthGuard redirija a /login mientras salimos hacia Mateo (crítico en iOS Safari). */
export const MATEO_SSO_EXIT_KEY = "polaria-mateo-sso-exit";

export function markMateoSsoExit(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(MATEO_SSO_EXIT_KEY, String(Date.now()));
  } catch {
    // sessionStorage puede fallar en modo privado estricto; la navegación sigue.
  }
}

export function isMateoSsoExitInProgress(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return sessionStorage.getItem(MATEO_SSO_EXIT_KEY) != null;
  } catch {
    return false;
  }
}

export function clearMateoSsoExitMark(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(MATEO_SSO_EXIT_KEY);
  } catch {
    // noop
  }
}
