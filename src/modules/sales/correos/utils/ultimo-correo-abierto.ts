const CLAVE = "polaria.ventas.correos.ultimoAbierto";

export function recordarCorreoAbierto(messageId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CLAVE, messageId);
  } catch {
    // Sin almacenamiento, la lista no marca el último abierto.
  }
}

export function leerCorreoAbierto(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}
