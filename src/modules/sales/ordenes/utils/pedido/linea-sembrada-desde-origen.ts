import { formatDecimalInputEs, parseDecimalEs } from "@/lib/utils/decimal-es";
import {
  UNIDAD_MEDIDA_VENTA_DEFAULT,
  type ProductoVentaOption,
} from "@/modules/sales/shared/types/sales.types";
import { stripLeadingProductoCodigo } from "@/modules/sales/shared/utils/producto-venta-nombre";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import type { OrigenCorreoRenglon } from "../origen/origen-correo-ordenes-trabajo";
import { formatPrecioInput, suggestFromCatalogo } from "./orden-venta-create-helpers";

interface LineaSembradaParams {
  row: OrigenCorreoRenglon;
  productos: ProductoVentaOption[];
  /** Orden de trabajo (página del formulario) a la que se asigna la línea. */
  otId: string;
}

/** Cantidad y precio del renglón de origen, ya como números. */
function cantidadYPrecio(row: OrigenCorreoRenglon) {
  const qty = parseDecimalEs(String(row.Cantidad ?? "")) ?? 0;
  const precio =
    typeof row.Precio === "number"
      ? row.Precio
      : (parseDecimalEs(String(row.Precio ?? "")) ?? 0);
  return { qty, precio };
}

/**
 * REQ-201: si el renglón ya se verificó al grabar avance (`_idProducto` en origen_correo y el
 * producto sigue en el catálogo), la línea nace con ese producto y no vuelve a pedir match.
 */
function lineaYaVerificada(
  catalogo: ProductoVentaOption,
  params: LineaSembradaParams & { nombre: string },
): LineaVentaForm {
  const { qty, precio } = cantidadYPrecio(params.row);
  const precioFinal = precio > 0 ? precio : catalogo.precioUnitario;
  return {
    idProducto: catalogo.idProducto,
    nombre: stripLeadingProductoCodigo(catalogo.nombre, catalogo.codigo),
    codigo: catalogo.codigo,
    idBodega: catalogo.idBodega,
    cantidadInput: qty > 0 ? formatDecimalInputEs(qty) : "",
    cajasInput: "",
    presentacion: "",
    especificacion: "",
    descuentoPctInput: "",
    ivaPct: "0",
    kgDisponible: catalogo.kgDisponible,
    unidadMedida: catalogo.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
    precioUnitario: precioFinal,
    precioInput: formatPrecioInput(precioFinal),
    precioManual: precio > 0,
    aliasCliente: params.nombre,
    filledByIa: false,
    otId: params.otId,
    catalogPending: false,
    catalogAmbiguo: false,
    sugerencia: null,
    sugerenciasAlternativas: [],
  };
}

/** Línea del formulario a partir de un renglón de origen_correo (pendiente de catálogo si no se verificó). */
export function lineaSembradaDesdeRenglon(params: LineaSembradaParams): LineaVentaForm {
  const { row, productos, otId } = params;
  const { qty, precio } = cantidadYPrecio(row);
  const nombre = row.Producto?.trim() || "Producto del correo";
  const codigo = row["Codigo producto"]?.trim() || "—";

  const idVerificado = row._idProducto?.trim() || "";
  const catalogo = idVerificado
    ? productos.find((producto) => producto.idProducto === idVerificado)
    : undefined;
  if (catalogo) return lineaYaVerificada(catalogo, { ...params, nombre });

  const query = [nombre, codigo !== "—" ? codigo : ""].filter(Boolean).join(" ");
  const suggested = suggestFromCatalogo(query, productos);
  return {
    idProducto: "",
    nombre,
    codigo,
    idBodega: suggested.sugerencia?.idBodega ?? "",
    cantidadInput: qty > 0 ? formatDecimalInputEs(qty) : "",
    cajasInput: "",
    presentacion: "",
    especificacion: "",
    descuentoPctInput: "",
    ivaPct: "0",
    kgDisponible: suggested.sugerencia?.kgDisponible ?? 0,
    unidadMedida: suggested.sugerencia?.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
    precioUnitario: precio,
    precioInput: formatPrecioInput(precio),
    precioManual: precio > 0,
    aliasCliente: nombre,
    filledByIa: true,
    otId,
    catalogPending: true,
    catalogAmbiguo: suggested.catalogAmbiguo,
    sugerencia: suggested.sugerencia,
    sugerenciasAlternativas: suggested.sugerenciasAlternativas,
  };
}
