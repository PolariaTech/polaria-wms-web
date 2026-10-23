import { parseDecimalEs } from "@/lib/utils/decimal-es";
import { validatePedidoCabecera } from "./pedido-form-validation";

export interface RevisionOtLinea {
  otId?: string;
  catalogPending?: boolean;
  idProducto?: string;
  cantidadInput: string;
  precioInput: string;
  aliasCliente?: string;
  nombre?: string;
}

export interface RevisionOtHija {
  id: string;
  label: string;
  almacen: string;
}

export type RevisionFocusKind =
  | "cliente"
  | "ordenCompra"
  | "fechaEntrega"
  | "ventana"
  | "productos"
  | "producto"
  | "cantidad"
  | "precio";

export interface RevisionPendiente {
  /** Índice 0-based de la OT; null = cabecera compartida. */
  otIndex: number | null;
  /** Etiqueta corta, p. ej. "OT 1" (sin centro de consumo). */
  otLabel: string | null;
  message: string;
  focusKind: RevisionFocusKind;
  /** Índice global en `lineas` cuando aplica. */
  lineaIndex: number | null;
}

function otShortLabel(index: number, total: number): string | null {
  return total > 1 ? `OT ${index + 1}` : null;
}

function withOtSuffix(message: string, otLabel: string | null): string {
  return otLabel ? `${message} · ${otLabel}` : message;
}

/**
 * Primera alerta de revisión para OV por confirmar (pie del modal).
 * Prioriza cabecera y luego OTs en orden.
 */
export function findPrimeraRevisionPendiente(params: {
  idComprador: string;
  exigeOc: boolean;
  ordenCompraHotel: string;
  fechaEntrega: string;
  todayIso: string;
  ventanaDesde: string;
  ventanaHasta: string;
  hijas: readonly RevisionOtHija[];
  lineas: readonly RevisionOtLinea[];
}): RevisionPendiente | null {
  if (!params.idComprador.trim()) {
    return {
      otIndex: null,
      otLabel: null,
      message: "Falta cliente",
      focusKind: "cliente",
      lineaIndex: null,
    };
  }
  if (params.exigeOc && !params.ordenCompraHotel.trim()) {
    return {
      otIndex: null,
      otLabel: null,
      message: "Falta orden de compra",
      focusKind: "ordenCompra",
      lineaIndex: null,
    };
  }

  const cabecera = validatePedidoCabecera({
    fechaEntrega: params.fechaEntrega,
    todayIso: params.todayIso,
    ventanaDesde: params.ventanaDesde,
    ventanaHasta: params.ventanaHasta,
  });
  if (cabecera) {
    const focusKind: RevisionFocusKind = cabecera.fields.includes(
      "fechaEntrega",
    )
      ? "fechaEntrega"
      : "ventana";
    return {
      otIndex: null,
      otLabel: null,
      message: cabecera.message.replace(/\.$/, ""),
      focusKind,
      lineaIndex: null,
    };
  }

  const hijas =
    params.hijas.length > 0
      ? params.hijas
      : [{ id: "", label: "Pedido", almacen: "" }];

  for (let i = 0; i < hijas.length; i += 1) {
    const hija = hijas[i]!;
    const otLabel = otShortLabel(i, hijas.length);
    const indexed = params.lineas
      .map((linea, lineaIndex) => ({ linea, lineaIndex }))
      .filter(({ linea }) => (hija.id ? linea.otId === hija.id : true));

    if (indexed.length === 0) {
      return {
        otIndex: i,
        otLabel,
        message: withOtSuffix("Sin productos", otLabel),
        focusKind: "productos",
        lineaIndex: null,
      };
    }

    for (const { linea, lineaIndex } of indexed) {
      if (linea.catalogPending || !linea.idProducto?.trim()) {
        const nombre =
          linea.aliasCliente?.trim() || linea.nombre?.trim() || "producto";
        return {
          otIndex: i,
          otLabel,
          message: withOtSuffix(`Producto sin validar (${nombre})`, otLabel),
          focusKind: "producto",
          lineaIndex,
        };
      }
      const cantidad = parseDecimalEs(linea.cantidadInput);
      if (cantidad === null || cantidad <= 0) {
        return {
          otIndex: i,
          otLabel,
          message: withOtSuffix("Falta cantidad", otLabel),
          focusKind: "cantidad",
          lineaIndex,
        };
      }
      const precio = parseDecimalEs(linea.precioInput);
      if (precio === null || precio <= 0) {
        return {
          otIndex: i,
          otLabel,
          message: withOtSuffix("Falta precio", otLabel),
          focusKind: "precio",
          lineaIndex,
        };
      }
    }
  }

  return null;
}

/** Selector CSS del control a enfocar/scroll (atributo data-ov-revision). */
export function revisionFocusSelector(
  pendiente: Pick<RevisionPendiente, "focusKind" | "lineaIndex">,
): string | null {
  switch (pendiente.focusKind) {
    case "cliente":
      return '[data-ov-revision="cliente"]';
    case "ordenCompra":
      return '[data-ov-revision="ordenCompra"]';
    case "fechaEntrega":
      return '[data-ov-revision="fechaEntrega"]';
    case "ventana":
      return '[data-ov-revision="ventanaDesde"]';
    case "productos":
      return '[data-ov-revision="productos"]';
    case "producto":
      return pendiente.lineaIndex == null
        ? null
        : `[data-ov-revision="producto-${pendiente.lineaIndex}"]`;
    case "cantidad":
      return pendiente.lineaIndex == null
        ? null
        : `[data-ov-revision="cantidad-${pendiente.lineaIndex}"]`;
    case "precio":
      return pendiente.lineaIndex == null
        ? null
        : `[data-ov-revision="precio-${pendiente.lineaIndex}"]`;
    default:
      return null;
  }
}
