import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "./origen-correo-ordenes-trabajo";
import { sellarIdProductoEnRenglonesOrigen } from "./sellar-id-producto-origen";
import { esRenglonOrigenPedible } from "./renglon-origen-pedible";

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
  const verificadas = params.lineas.filter((linea) =>
    Boolean(linea.idProducto?.trim()),
  );
  for (const hija of params.hijas) {
    const lineasOt = params.lineas.filter((linea) => linea.otId === hija.id);
    if (lineasOt.length > 0) {
      for (const linea of lineasOt) {
        const producto = linea.aliasCliente?.trim() || linea.nombre;
        // REQ-234: no persistir en origen_correo SKUs con cantidad <= 0.
        if (
          !esRenglonOrigenPedible({
            Producto: producto,
            "Codigo producto": linea.codigo,
            Cantidad: linea.cantidad,
          })
        ) {
          continue;
        }
        const idProducto = linea.idProducto?.trim() || "";
        out.push({
          _otId: hija.id,
          Almacen: hija.almacen,
          "Numero pedido": hija.numeroPedido,
          Fecha: hija.fecha,
          "Referencia pedido": hija.referenciaPedido,
          "Responsable externo": hija.responsableExterno,
          Producto: producto,
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
    // REQ-236: sellar verificaciones aunque el otId del form no haya matcheado.
    const selladas = sellarIdProductoEnRenglonesOrigen({
      renglones: rows,
      lineasVerificadas: verificadas,
    });
    for (const row of selladas) {
      if (!esRenglonOrigenPedible(row)) continue;
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
