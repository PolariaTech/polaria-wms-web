import type { ProductoVentaOption } from "@/modules/sales/shared/types/sales.types";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import { formatPrecioInput } from "./orden-venta-create-helpers";

export type PreciosSeparadosComprador = {
  ultimos: Record<string, number>;
  equivalencia: Record<string, number>;
};

function positivo(valor: number | undefined): number | undefined {
  return valor != null && valor > 0 ? valor : undefined;
}

/** REQ-366: último del cliente, luego lista, luego precio de la equivalencia. */
export function precioCuandoLaSolicitudNoTrajo(input: {
  ultimo?: number;
  lista?: number;
  equivalencia?: number;
  /** El mismo precio que el catálogo ya muestra en Precio/kg. Solo si no hubo último. */
  precioDelPicker?: number;
}): number {
  const ultimo = positivo(input.ultimo);
  const lista = positivo(input.lista);
  const equivalencia =
    positivo(input.equivalencia) ??
    (ultimo == null ? positivo(input.precioDelPicker) : undefined);
  if (ultimo != null) return ultimo;
  if (lista != null) return lista;
  if (equivalencia != null) return equivalencia;
  return 0;
}

export function aplicarPrecioFaltanteALinea(
  linea: LineaVentaForm,
  separados: PreciosSeparadosComprador,
  productosBase: readonly ProductoVentaOption[],
  precioDelPicker?: number,
): LineaVentaForm {
  if (linea.precioManual !== false || !linea.idProducto || linea.catalogPending) {
    return linea;
  }
  const lista = productosBase.find(
    (row) => row.idProducto === linea.idProducto,
  )?.precioUnitario;
  const precio = precioCuandoLaSolicitudNoTrajo({
    ultimo: separados.ultimos[linea.idProducto],
    lista,
    equivalencia: separados.equivalencia[linea.idProducto],
    precioDelPicker,
  });
  const precioInput = formatPrecioInput(precio);
  if (linea.precioUnitario === precio && linea.precioInput === precioInput) {
    return linea;
  }
  return {
    ...linea,
    precioUnitario: precio,
    precioInput,
    precioManual: false,
  };
}
