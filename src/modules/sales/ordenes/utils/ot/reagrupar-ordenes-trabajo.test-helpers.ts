import type { LineaReagrupable, OtPropuestaApi } from "./reagrupar-ordenes-trabajo";
import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";

export interface LineaTest extends LineaReagrupable {
  precioUnitario: number;
  unidadMedida: string;
}

export function hija(params: {
  clave: string;
  almacen: string;
  pedido: string;
  renglones: Array<[string, number]>;
}): OrdenTrabajoHija {
  const renglones = params.renglones.map(([Producto, Cantidad]) => ({
    Producto,
    Cantidad,
    Unidad: "KGS",
    "Codigo producto": `COD-${Producto.slice(0, 3).toUpperCase()}`,
    "Notas generales": "NOTA-PRIVADA",
    "Telefono contacto": "5551234567",
  }));
  return {
    id: params.clave,
    label: `${params.pedido} — ${params.almacen}`,
    numeroPedido: params.pedido,
    almacen: params.almacen,
    referenciaPedido: "",
    fecha: "",
    responsableExterno: "",
    renglones,
    totalCantidad: params.renglones.reduce((suma, [, kg]) => suma + kg, 0),
  };
}

export function linea(
  nombre: string,
  kg: number,
  otId: string | undefined,
): LineaTest {
  return {
    nombre,
    codigo: `COD-${nombre.slice(0, 3).toUpperCase()}`,
    cantidadInput: String(kg),
    otId,
    precioUnitario: 10,
    unidadMedida: "KGS",
  };
}

export const parseCantidad = (raw: string) => Number(raw);

/** 5 OT, 6 renglones: comedor | bares(2) | banquetes | cocina | spa. */
export function escenario() {
  const hijas = [
    hija({ clave: "ot-comedor", almacen: "COMEDOR", pedido: "PO-1", renglones: [["AGUACATE", 25]] }),
    hija({ clave: "ot-bares", almacen: "BARES", pedido: "PO-1", renglones: [["LIMON", 40], ["PIÑA", 40]] }),
    hija({ clave: "ot-banquetes", almacen: "BANQUETES", pedido: "PO-2", renglones: [["PAPAYA", 10]] }),
    hija({ clave: "ot-cocina", almacen: "COCINA", pedido: "PO-3", renglones: [["MELON", 12]] }),
    hija({ clave: "ot-spa", almacen: "SPA", pedido: "PO-4", renglones: [["SANDIA", 8]] }),
  ];
  const lineas = [
    linea("AGUACATE", 25, "ot-comedor"),
    linea("LIMON", 40, "ot-bares"),
    linea("PIÑA", 40, "ot-bares"),
    linea("PAPAYA", 10, "ot-banquetes"),
    linea("MELON", 12, "ot-cocina"),
    linea("SANDIA", 8, "ot-spa"),
  ];
  return { hijas, lineas };
}

/** Id estable de un renglón por (índice de OT, índice de renglón). */
export const id = (indiceOt: number, indiceRenglon = 0) =>
  `renglon-${indiceOt}-${indiceRenglon}`;

export function existente(otId: string, renglonIds: string[]): OtPropuestaApi {
  return { otId, nuevaClave: null, etiquetaSugerida: null, renglonIds };
}

export function nueva(
  clave: string,
  renglonIds: string[],
  etiquetaSugerida: string | null = null,
): OtPropuestaApi {
  return { otId: null, nuevaClave: clave, etiquetaSugerida, renglonIds };
}

/** Plan 5→3: banquetes→comedor, cocina→bares, spa queda. */
export function plan5a3(): OtPropuestaApi[] {
  return [
    existente("ot-comedor", [id(0), id(2)]),
    existente("ot-bares", [id(1, 0), id(1, 1), id(3)]),
    existente("ot-spa", [id(4)]),
  ];
}

export function congelarProfundo<T>(valor: T): T {
  if (valor && typeof valor === "object") {
    Object.values(valor as Record<string, unknown>).forEach(congelarProfundo);
    Object.freeze(valor);
  }
  return valor;
}
