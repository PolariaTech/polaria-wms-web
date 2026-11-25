import { describe, expect, it } from "vitest";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import type { ProductoVentaOption } from "../../shared/types/sales.types";
import {
  agregarProductoAOrdenesTrabajo,
  resolveOtIdParaLineaNueva,
} from "./editar-lineas-ov-helpers";

const PRODUCTO_DEMO: ProductoVentaOption = {
  idProducto: "prod-1",
  codigo: "SKU-01",
  nombre: "SKU-01 Jitomate saladette",
  idBodega: "bod-1",
  unidadMedida: "KG",
  precioUnitario: 42.5,
  stockDisponible: 100,
};

function crearHija(overrides?: Partial<OrdenTrabajoHija>): OrdenTrabajoHija {
  return {
    id: "ot-1",
    label: "OT 1",
    almacen: "COCINA",
    numeroPedido: "OC-100",
    fecha: "2026-11-24",
    referenciaPedido: "REF-1",
    responsableExterno: "Chef Ana",
    renglones: [],
    totalCantidad: 0,
    ...overrides,
  };
}

describe("resolveOtIdParaLineaNueva", () => {
  it("prioriza la OT activa del pager cuando tiene valor", () => {
    expect(
      resolveOtIdParaLineaNueva({
        hijaFormActivaId: "  ot-2  ",
        ordenesTrabajoIds: ["ot-1", "ot-2"],
      }),
    ).toBe("ot-2");
  });

  it("usa la única OT disponible si no hay OT activa", () => {
    expect(
      resolveOtIdParaLineaNueva({
        hijaFormActivaId: null,
        ordenesTrabajoIds: ["ot-unica"],
      }),
    ).toBe("ot-unica");
  });

  it("devuelve undefined cuando hay múltiples OT y ninguna activa", () => {
    expect(
      resolveOtIdParaLineaNueva({
        hijaFormActivaId: "",
        ordenesTrabajoIds: ["ot-1", "ot-2"],
      }),
    ).toBeUndefined();
  });
});

describe("agregarProductoAOrdenesTrabajo", () => {
  it("descarta renglones placeholder vacíos, agrega el producto y recalcula totalCantidad", () => {
    const hija = crearHija({
      renglones: [
        { Producto: "   ", "Codigo producto": "", Cantidad: 0 },
        { Producto: "Limón", "Codigo producto": "LIM-1", Cantidad: "3,5" },
      ],
      totalCantidad: 3.5,
    });

    const resultado = agregarProductoAOrdenesTrabajo({
      prev: [hija],
      origenCorreoDraft: [],
      otId: "ot-1",
      row: PRODUCTO_DEMO,
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].renglones).toHaveLength(2);
    expect(resultado[0].renglones[1]).toMatchObject({
      _otId: "ot-1",
      Almacen: "COCINA",
      "Numero pedido": "OC-100",
      Producto: "Jitomate saladette",
      "Codigo producto": "SKU-01",
      Cantidad: 0,
      Unidad: "KG",
      Precio: 42.5,
    });
    expect(resultado[0].totalCantidad).toBe(3.5);
  });

  it("no modifica otras OT distintas a otId", () => {
    const ot1 = crearHija({ id: "ot-1" });
    const ot2 = crearHija({
      id: "ot-2",
      renglones: [{ Producto: "Cebolla", Cantidad: 2 }],
      totalCantidad: 2,
    });

    const resultado = agregarProductoAOrdenesTrabajo({
      prev: [ot1, ot2],
      origenCorreoDraft: [],
      otId: "ot-1",
      row: PRODUCTO_DEMO,
    });

    expect(resultado[0].renglones).toHaveLength(1);
    expect(resultado[1]).toBe(ot2);
  });
});
