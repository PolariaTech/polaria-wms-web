import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "../../shared/types/sales.types";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import {
  formatPrecioInput,
  suggestFromCatalogo,
} from "../utils/pedido/orden-venta-create-helpers";
import { stripLeadingProductoCodigo } from "../../shared/utils/producto-venta-nombre";

/** Completa sugerencias de catálogo en líneas pendientes. Devuelve el mismo arreglo si nada cambió. */
export function actualizarSugerenciasDeCatalogo(
  prev: LineaVentaForm[],
  productos: readonly ProductoVentaOption[],
): LineaVentaForm[] {
  let changed = false;
  const next = prev.map((linea) => {
    const suggested = sugerenciaSiPendiente(linea, productos);
    if (!suggested || mismaSugerencia(linea, suggested)) return linea;
    changed = true;
    return {
      ...linea,
      idBodega: linea.idBodega || suggested.sugerencia.idBodega,
      kgDisponible:
        linea.kgDisponible > 0
          ? linea.kgDisponible
          : suggested.sugerencia.kgDisponible,
      unidadMedida:
        linea.unidadMedida ||
        suggested.sugerencia.unidadMedida ||
        UNIDAD_MEDIDA_VENTA_DEFAULT,
      catalogAmbiguo: suggested.catalogAmbiguo,
      sugerencia: suggested.sugerencia,
      sugerenciasAlternativas: suggested.sugerenciasAlternativas,
    };
  });
  return changed ? next : prev;
}

function sugerenciaSiPendiente(
  linea: LineaVentaForm,
  productos: readonly ProductoVentaOption[],
) {
  if (!linea.catalogPending || linea.idProducto) return null;
  const query = (linea.aliasCliente || linea.nombre || "").trim();
  if (!query) return null;
  const suggested = suggestFromCatalogo(query, productos);
  if (!suggested.sugerencia) return null;
  return {
    sugerencia: suggested.sugerencia,
    sugerenciasAlternativas: suggested.sugerenciasAlternativas,
    catalogAmbiguo: suggested.catalogAmbiguo,
  };
}

function mismaSugerencia(
  linea: LineaVentaForm,
  suggested: NonNullable<ReturnType<typeof sugerenciaSiPendiente>>,
): boolean {
  const samePrimary =
    linea.sugerencia?.idProducto === suggested.sugerencia.idProducto;
  const sameAlts =
    (linea.sugerenciasAlternativas?.length ?? 0) ===
      suggested.sugerenciasAlternativas.length &&
    (linea.sugerenciasAlternativas ?? []).every(
      (alt, i) =>
        alt.idProducto === suggested.sugerenciasAlternativas[i]?.idProducto,
    );
  return samePrimary && sameAlts;
}

export function crearLineaDesdeProducto(
  row: ProductoVentaOption,
  otId: string | undefined,
): LineaVentaForm {
  return {
    idProducto: row.idProducto,
    nombre: stripLeadingProductoCodigo(row.nombre, row.codigo),
    codigo: row.codigo,
    idBodega: row.idBodega,
    cantidadInput: "",
    cajasInput: "",
    presentacion: "",
    especificacion: "",
    ivaPct: "0",
    kgDisponible: row.kgDisponible,
    unidadMedida: row.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
    precioUnitario: row.precioUnitario,
    precioInput: formatPrecioInput(row.precioUnitario),
    otId,
    catalogPending: false,
    catalogAmbiguo: false,
    sugerencia: null,
    sugerenciasAlternativas: [],
  };
}
