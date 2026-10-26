import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";

/**
 * REQ-141: alinear Notas generales del origen con las de la OV.
 * Vacío = el usuario las borró (no reinyectar texto viejo del correo).
 */
export function withNotasGeneralesOnHijas(
  hijas: OrdenTrabajoHija[],
  notas: string,
): OrdenTrabajoHija[] {
  const notasNorm = notas.trim();
  return hijas.map((hija) => ({
    ...hija,
    renglones: (
      hija.renglones.length > 0
        ? hija.renglones
        : [{ Producto: "", Cantidad: 0 }]
    ).map((row) => ({
      ...row,
      "Notas generales": notasNorm,
    })),
  }));
}
