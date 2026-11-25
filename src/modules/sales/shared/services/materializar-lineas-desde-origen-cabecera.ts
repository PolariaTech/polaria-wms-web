import type {
  MaterializeLineaPlan,
  MaterializeOvPlan,
} from "../../ordenes/utils/origen/materialize-ov-desde-origen";
import type { OrigenCorreoRenglon } from "../../ordenes/utils/origen/origen-correo-ordenes-trabajo";

export interface OrdenVentaHeaderMaterializacion {
  estado: string;
  id_comprador: string | null;
  orden_compra_hotel: string | null;
  centro_consumo: string | null;
  contacto_entrega: string | null;
  correo_contacto: string | null;
  fecha_entrega: string | null;
  notas_lineas: string | null;
  origen_correo: unknown;
  origen_texto: string | null;
}

export function necesitaMaterializarCabecera(
  header: OrdenVentaHeaderMaterializacion,
  sinSello: boolean,
): boolean {
  return (
    !header.id_comprador?.trim() ||
    (sinSello &&
      (!header.orden_compra_hotel?.trim() ||
        !header.centro_consumo?.trim() ||
        !header.contacto_entrega?.trim() ||
        !header.fecha_entrega?.trim()))
  );
}

export function extraerCorreoContactoDesdeOrigen(
  origen: readonly OrigenCorreoRenglon[],
): string {
  return (
    origen
      .map((fila) =>
        typeof fila === "object" && fila && "Correo contacto" in fila
          ? String(
              (fila as { "Correo contacto"?: unknown })["Correo contacto"] ?? "",
            ).trim()
          : "",
      )
      .find(Boolean) || ""
  );
}

export function buildCabeceraPatchDesdeOrigen(params: {
  header: OrdenVentaHeaderMaterializacion;
  plan: MaterializeOvPlan;
  origen: readonly OrigenCorreoRenglon[];
  sinSello: boolean;
}): Record<string, unknown> {
  const { header, plan, origen, sinSello } = params;
  const patch: Record<string, unknown> = {};

  if (!header.id_comprador?.trim() && plan.idComprador) {
    patch.id_comprador = plan.idComprador;
  }
  if (sinSello && !header.orden_compra_hotel?.trim() && plan.ordenCompraHotel) {
    patch.orden_compra_hotel = plan.ordenCompraHotel;
  }
  if (sinSello && !header.centro_consumo?.trim() && plan.centroConsumo) {
    patch.centro_consumo = plan.centroConsumo;
  }
  if (sinSello && !header.contacto_entrega?.trim() && plan.contactoEntrega) {
    patch.contacto_entrega = plan.contactoEntrega;
  }
  if (sinSello && !header.fecha_entrega?.trim() && plan.fechaEntrega) {
    patch.fecha_entrega = plan.fechaEntrega;
  }
  const correoFromOrigen = extraerCorreoContactoDesdeOrigen(origen);
  if (sinSello && !header.correo_contacto?.trim() && correoFromOrigen) {
    patch.correo_contacto = correoFromOrigen;
  }

  return patch;
}

export function buildFilasInsertarOrdenVentaLinea(
  idOrdenVenta: string,
  lineas: readonly MaterializeLineaPlan[],
) {
  return lineas.map((linea) => ({
    id_orden_venta: idOrdenVenta,
    id_producto: linea.idProducto,
    cantidad_pedida: linea.cantidadPedida,
    precio_unitario: linea.precioUnitario > 0 ? linea.precioUnitario : 0,
    cajas: null,
    presentacion: null,
    unidad_medida: linea.unidadMedida?.trim() || null,
    match_producto: linea.matchProducto,
  }));
}
