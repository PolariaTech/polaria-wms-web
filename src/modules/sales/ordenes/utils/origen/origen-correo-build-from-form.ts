import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "./origen-correo-ordenes-trabajo";

export type LineaOrigenOtSync = {
  otId?: string;
  /** REQ-201: id de catálogo si el operador ya verificó la línea. */
  idProducto?: string;
  nombre: string;
  codigo: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  aliasCliente?: string;
};

/**
 * Arma origen_correo desde las OTs editadas + líneas del formulario.
 * Prioriza productos del form por otId; si una OT no tiene líneas, conserva sus renglones.
 */
export function buildOrigenCorreoFromOrdenesYLineas(params: {
  hijas: readonly OrdenTrabajoHija[];
  lineas: readonly LineaOrigenOtSync[];
}): OrigenCorreoRenglon[] {
  const out: OrigenCorreoRenglon[] = [];
  for (const hija of params.hijas) {
    const lineasOt = params.lineas.filter((linea) => linea.otId === hija.id);
    if (lineasOt.length > 0) {
      for (const linea of lineasOt) {
        const idProducto = linea.idProducto?.trim() || "";
        out.push({
          _otId: hija.id,
          Almacen: hija.almacen,
          "Numero pedido": hija.numeroPedido,
          Fecha: hija.fecha,
          "Referencia pedido": hija.referenciaPedido,
          "Responsable externo": hija.responsableExterno,
          Producto: linea.aliasCliente?.trim() || linea.nombre,
          "Codigo producto": linea.codigo,
          Cantidad: linea.cantidad,
          Unidad: linea.unidadMedida,
          Precio: linea.precioUnitario,
          ...(idProducto ? { _idProducto: idProducto } : {}),
        });
      }
      continue;
    }

    const rows =
      hija.renglones.length > 0
        ? hija.renglones
        : [{ Producto: "", Cantidad: 0 }];
    for (const row of rows) {
      out.push({
        ...row,
        _otId: hija.id,
        Almacen: hija.almacen || row.Almacen,
        "Numero pedido": hija.numeroPedido || row["Numero pedido"],
        Fecha: hija.fecha || row.Fecha,
        "Referencia pedido":
          hija.referenciaPedido || row["Referencia pedido"],
        "Responsable externo":
          hija.responsableExterno || row["Responsable externo"],
      });
    }
  }
  return out;
}
