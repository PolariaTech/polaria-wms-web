import { isMateoSsoExitInProgress } from "@/lib/auth/mateo-sso-exit";
import { useSessionExpiredStore } from "@/stores/session-expired.store";

export const TITULO_SESION_EXPIRADA = "Sesión expirada";
export const MENSAJE_SESION_EXPIRADA =
  "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.";
export const ETIQUETA_ACEPTAR_SESION_EXPIRADA = "Aceptar";

/**
 * Rutas donde un 401 NO significa que el token venció: el API lo usa para
 * avisar que la contraseña actual es incorrecta.
 */
const RUTAS_401_ES_ERROR_DE_NEGOCIO: readonly string[] = ["/auth/me/password"];

function soloRuta(path: string): string {
  return path.split("?")[0] ?? path;
}

/**
 * Abre el modal de sesión expirada. Se llama cuando el API rechazó el token
 * con 401 y la renovación del token también falló.
 */
export function notifySessionExpired(path: string): void {
  if (RUTAS_401_ES_ERROR_DE_NEGOCIO.includes(soloRuta(path))) return;
  // Durante el salto a Mateo la sesión se cierra a propósito; no es un vencimiento.
  if (isMateoSsoExitInProgress()) return;

  useSessionExpiredStore.getState().open();
}
