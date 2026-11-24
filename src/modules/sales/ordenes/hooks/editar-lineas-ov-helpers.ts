import {
  groupOrigenCorreoToOrdenesTrabajo,
  type OrdenTrabajoHija,
  type OrigenCorreoRenglon,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import { stripLeadingProductoCodigo } from "../../shared/utils/producto-venta-nombre";
import {
  UNIDAD_MEDIDA_VENTA_DEFAULT,
  type ProductoVentaOption,
} from "../../shared/types/sales.types";

/** REQ-311: OT activa del pager, o la única OT si no hay pager. */
export function resolveOtIdParaLineaNueva(params: {
  hijaFormActivaId?: string | null;
  ordenesTrabajoIds: readonly string[];
}): string | undefined {
  const activa = params.hijaFormActivaId?.trim();
  if (activa) return activa;
  if (params.ordenesTrabajoIds.length === 1) {
    const unica = params.ordenesTrabajoIds[0]?.trim();
    return unica || undefined;
  }
  return undefined;
}

/**
 * Agrega un renglón nuevo a la OT indicada, descartando renglones placeholder
 * vacíos y recalculando `totalCantidad`.
 */
export function agregarProductoAOrdenesTrabajo(params: {
  prev: OrdenTrabajoHija[];
  origenCorreoDraft: OrigenCorreoRenglon[];
  otId: string;
  row: ProductoVentaOption;
}): OrdenTrabajoHija[] {
  const { prev, origenCorreoDraft, otId, row } = params;
  const base =
    prev.length > 0
      ? prev
      : groupOrigenCorreoToOrdenesTrabajo(origenCorreoDraft);

  return base.map((hija) => {
    if (hija.id !== otId) return hija;
    const sinPlaceholder = hija.renglones.filter(
      (renglon) =>
        (renglon.Producto ?? "").trim() ||
        (renglon["Codigo producto"] ?? "").trim(),
    );
    const renglon: OrigenCorreoRenglon = {
      _otId: hija.id,
      Almacen: hija.almacen,
      "Numero pedido": hija.numeroPedido,
      Fecha: hija.fecha,
      "Referencia pedido": hija.referenciaPedido,
      "Responsable externo": hija.responsableExterno,
      Producto: stripLeadingProductoCodigo(row.nombre, row.codigo),
      "Codigo producto": row.codigo,
      Cantidad: 0,
      Unidad: row.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
      Precio: row.precioUnitario,
    };
    const renglones = [...sinPlaceholder, renglon];
    return {
      ...hija,
      renglones,
      totalCantidad: renglones.reduce((sum, item) => {
        const qty =
          typeof item.Cantidad === "number"
            ? item.Cantidad
            : Number(String(item.Cantidad ?? "").replace(",", ".")) || 0;
        return sum + qty;
      }, 0),
    };
  });
}
