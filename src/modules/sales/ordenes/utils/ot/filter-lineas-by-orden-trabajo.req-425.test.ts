import { describe, expect, it } from "vitest";
import {
  assignOtIdsToFormLineas,
  buildOtIdByDetalleLineaId,
  filterLineasByOrdenTrabajoHija,
} from "./filter-lineas-by-orden-trabajo";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../origen/origen-correo-ordenes-trabajo";

function hija(id: string, renglones: OrigenCorreoRenglon[]): OrdenTrabajoHija {
  return {
    id,
    label: id,
    numeroPedido: "4503007927",
    almacen: id,
    referenciaPedido: "",
    fecha: "",
    responsableExterno: "",
    renglones,
    totalCantidad: 0,
  };
}

/** Patrón de OV-00003001: código del cliente ≠ SKU y nombres que comparten palabra. */
const ROOM_SERVICE = hija("room-service", [
  { Producto: "LECHUGA LARGA", "Codigo producto": "1000566", Cantidad: 2, Precio: 46 },
  { Producto: "CHILE SERRANO", "Codigo producto": "1000570", Cantidad: 0.5, Precio: 39 },
]);
const MEDITERRANEO = hija("mediterraneo", [
  { Producto: "LECHUGA ROMANA", "Codigo producto": "1000567", Cantidad: 2, Precio: 27 },
  { Producto: "CHILE HABANERO", "Codigo producto": "1000571", Cantidad: 0.5, Precio: 80 },
]);

function lineaBd(id: string, sku: string, nombre: string, texto: string, kg: number, precio: number) {
  return {
    id_linea_orden_venta: id,
    cantidad_pedida: kg,
    precio_unitario: precio,
    match_producto: { textoCliente: texto },
    producto: { sku, descripcion: nombre, metadatos_catalogo: null },
  };
}

// LECHUGA LARGA no se materializó (sin catálogo): no hay línea para ese renglón.
const LINEAS_BD = [
  lineaBd("serrano", "115001", "CHILE SERRANO", "CHILE SERRANO", 0.5, 39),
  lineaBd("romana", "115002", "LECHUGA ROMANA", "LECHUGA ROMANA", 2, 27),
  lineaBd("habanero", "115003", "CHILE HABANERO", "CHILE HABANERO", 0.5, 80),
];

describe("REQ-425: asignación de líneas a la tarea por el texto del cliente", () => {
  it("un renglón sin línea propia no se lleva la de otro producto de otra tarea", () => {
    const otPorLinea = buildOtIdByDetalleLineaId(LINEAS_BD, [ROOM_SERVICE, MEDITERRANEO]);

    expect(otPorLinea.get("serrano")).toBe("room-service");
    expect(otPorLinea.get("romana")).toBe("mediterraneo");
    expect(otPorLinea.get("habanero")).toBe("mediterraneo");
  });

  it("el formulario usa el alias del cliente y deja LECHUGA LARGA pendiente", () => {
    const lineasForm = LINEAS_BD.map((lineaGuardada) => ({
      nombre: lineaGuardada.producto.descripcion,
      codigo: lineaGuardada.producto.sku,
      cantidadInput: String(lineaGuardada.cantidad_pedida),
      precioUnitario: lineaGuardada.precio_unitario,
      aliasCliente: lineaGuardada.match_producto.textoCliente,
    }));

    const conOt = assignOtIdsToFormLineas(lineasForm, [ROOM_SERVICE, MEDITERRANEO], Number);

    expect(conOt.map((lineaForm) => [lineaForm.nombre, lineaForm.otId])).toEqual([
      ["CHILE SERRANO", "room-service"],
      ["LECHUGA ROMANA", "mediterraneo"],
      ["CHILE HABANERO", "mediterraneo"],
    ]);
  });

  it("mismo producto y cantidad en dos tareas: el precio decide", () => {
    const desayunos = hija("desayunos", [{ Producto: "CALABAZA ITALIANA", Cantidad: 6, Precio: 1 }]);
    const comedor = hija("comedor", [{ Producto: "CALABAZA ITALIANA", Cantidad: 6, Precio: 0 }]);
    const lineas = [
      lineaBd("sin-precio", "200", "CALABAZA ITALIANA", "CALABAZA ITALIANA", 6, 0),
      lineaBd("con-precio", "200", "CALABAZA ITALIANA", "CALABAZA ITALIANA", 6, 1),
    ];

    const otPorLinea = buildOtIdByDetalleLineaId(lineas, [desayunos, comedor]);

    expect(otPorLinea.get("con-precio")).toBe("desayunos");
    expect(otPorLinea.get("sin-precio")).toBe("comedor");
  });

  it("por tarea, el texto exacto gana aunque otro renglón aparezca antes", () => {
    const lineas = filterLineasByOrdenTrabajoHija(LINEAS_BD, MEDITERRANEO);

    expect(lineas.map((lineaTarea) => lineaTarea.id_linea_orden_venta)).toEqual([
      "romana",
      "habanero",
    ]);
  });

  it("sin texto del cliente sigue emparejando por nombre y cantidad (legado)", () => {
    const legado = LINEAS_BD.map(({ match_producto: _sinTexto, ...resto }) => resto);

    const otPorLinea = buildOtIdByDetalleLineaId(legado, [MEDITERRANEO]);

    expect(otPorLinea.get("romana")).toBe("mediterraneo");
    expect(otPorLinea.get("habanero")).toBe("mediterraneo");
  });
});
