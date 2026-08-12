/** Cuenta Mit + bodega externa Fridem → fuente `mit.inventario` en Supabase. */
export const MIT_CUENTA_CODIGO = "02808";
export const MIT_FRIDEM_BODEGA_NOMBRE = "Fridem";

/** True cuando el inventario debe leerse desde el schema `mit` (no warehouse_state). */
export function usaInventarioMitSchema(
  codigoCuenta: string | null | undefined,
  bodegaNombre: string | null | undefined,
): boolean {
  if (!codigoCuenta?.trim() || !bodegaNombre?.trim()) return false;
  return (
    codigoCuenta.trim().toUpperCase() === MIT_CUENTA_CODIGO &&
    bodegaNombre.trim().toLowerCase() === MIT_FRIDEM_BODEGA_NOMBRE.toLowerCase()
  );
}

/** True si la cuenta Mit debe sumar kg de `mit.inventario` en bodega externa. */
export function usaKgMitInventarioExterna(
  codigoCuenta: string | null | undefined,
): boolean {
  return codigoCuenta?.trim().toUpperCase() === MIT_CUENTA_CODIGO;
}
