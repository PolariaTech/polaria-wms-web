import { ROUTES } from "@/config/routes";

const PROTECTED_PREFIXES = [
  ROUTES.configurator,
  ROUTES.dashboard,
  ROUTES.platform,
  ROUTES.perfil,
  ROUTES.imprimirDespacho,
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** QR público: no rehidratar sesión al volver de Fototeca (iOS). */
export function isCapturaOrdenPath(pathname: string): boolean {
  return pathname === "/captura-orden" || pathname.startsWith("/captura-orden/");
}

/** REQ-292: despacho público, sin usuario ni clave. */
export function isDespachoPublicoPath(pathname: string): boolean {
  return (
    pathname === ROUTES.despachoPublico ||
    pathname.startsWith(`${ROUTES.despachoPublico}/`)
  );
}
