/**
 * REQ-293: el gate de versión solo corre en builds de producción
 * (no en `next dev` ni en tests).
 */
export function isProductVersionCheckEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}
