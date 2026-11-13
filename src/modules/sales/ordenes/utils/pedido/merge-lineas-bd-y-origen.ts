import type { ProductoVentaOption } from "@/modules/sales/shared/types/sales.types";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../origen/origen-correo-ordenes-trabajo";
import { applyVerificacionesOrigenALineas } from "./apply-verificaciones-origen-lineas";
import { lineaSembradaDesdeRenglon } from "./linea-sembrada-desde-origen";
import { indicesRenglonesSinLinea } from "./renglones-sin-linea";
import { resolveEspecificacionPedidoLinea } from "./resolve-especificacion-pedido-linea";

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
    );

    // REQ-309: el pendiente es el renglón sin línea, no el último de la lista.
    for (const indice of indicesRenglonesSinLinea(enBd, renglones)) {
      const row = renglones[indice]!;
      const sembrada = lineaSembradaDesdeRenglon({
        row,
        productos: params.productos,
        otId: hija.id,
      });
      // REQ-287: el renglón pendiente conserva lo que el cliente pidió (sin penacho, en bote…).
      extras.push({
        ...sembrada,
        especificacion:
          sembrada.especificacion ||
          resolveEspecificacionPedidoLinea({
            especificacionIa: null,
            textoOriginal: row.Producto,
            especificacionOrigen: row.Especificacion,
          }),
      });
    }
  }

  const fusionadas = [...params.lineasBd, ...extras];
  return applyVerificacionesOrigenALineas(
    fusionadas,
    params.origenRows,
    params.productos,
  );
}
