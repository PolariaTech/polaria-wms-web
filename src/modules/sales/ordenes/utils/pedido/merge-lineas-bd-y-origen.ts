import type { ProductoVentaOption } from "@/modules/sales/shared/types/sales.types";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../origen/origen-correo-ordenes-trabajo";
import { applyVerificacionesOrigenALineas } from "./apply-verificaciones-origen-lineas";
import { lineaSembradaDesdeRenglon } from "./linea-sembrada-desde-origen";

function renglonTieneProducto(row: OrigenCorreoRenglon): boolean {
  return Boolean((row.Producto ?? "").trim());
}

/**
 * REQ-236: al reabrir OV materializada, unir líneas BD + renglones de origen
 * que aún no tienen par en BD, y reaplicar `_idProducto` del avance.
 */
export function mergeLineasBdConOrigenPendiente(params: {
  lineasBd: LineaVentaForm[];
  hijas: readonly OrdenTrabajoHija[];
  origenRows: readonly OrigenCorreoRenglon[];
  productos: ProductoVentaOption[];
}): LineaVentaForm[] {
  const extras: LineaVentaForm[] = [];

  for (const hija of params.hijas) {
    const renglones = hija.renglones.filter(renglonTieneProducto);
    if (renglones.length === 0) continue;

    const enBd = params.lineasBd.filter(
      (linea) => linea.otId?.trim() === hija.id,
    ).length;

    for (let indice = enBd; indice < renglones.length; indice += 1) {
      extras.push(
        lineaSembradaDesdeRenglon({
          row: renglones[indice]!,
          productos: params.productos,
          otId: hija.id,
        }),
      );
    }
  }

  const fusionadas = [...params.lineasBd, ...extras];
  return applyVerificacionesOrigenALineas(
    fusionadas,
    params.origenRows,
    params.productos,
  );
}
