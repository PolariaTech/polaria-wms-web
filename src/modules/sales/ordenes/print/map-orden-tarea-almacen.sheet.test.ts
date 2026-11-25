import { describe, expect, it } from "vitest";
import {
  formatOrdenTrabajoCorto,
  paginarHojaPorProductos,
  PRODUCTOS_POR_HOJA_TAREA,
} from "./map-orden-tarea-almacen.sheet";

describe("PRODUCTOS_POR_HOJA_TAREA", () => {
  it("queda en 30 productos por hoja de impresión", () => {
    expect(PRODUCTOS_POR_HOJA_TAREA).toBe(30);
  });
});

describe("formatOrdenTrabajoCorto", () => {
  it("sin paginación usa i/t", () => {
    expect(formatOrdenTrabajoCorto(2, 5)).toBe("2/5");
  });

  it("con varias hojas incluye número de hoja", () => {
    expect(formatOrdenTrabajoCorto(2, 5, 3, 4)).toBe("3-2/5");
  });
});

describe("paginarHojaPorProductos", () => {
  it("parte líneas cuando superan el tope", () => {
    const lineas = Array.from({ length: PRODUCTOS_POR_HOJA_TAREA + 5 }, (_, i) => ({
      producto: `P${i}`,
      especificacion: "",
      cantidadSolicitada: "1 kg",
    }));
    const pages = paginarHojaPorProductos({
      idOrdenVenta: "ov",
      idOrdenTrabajo: "",
      tareaIndex: 1,
      tareaTotal: 1,
      folio: "F",
      creada: "",
      impresa: "",
      cliente: "",
      centroConsumo: "",
      numeroOrdenCliente: "",
      ordenTrabajo: "1/1",
      fechaEntrega: "",
      diaEntrega: "",
      horaEntrega: "",
      direccionEntrega: "",
      notasGenerales: "",
      lineas,
    });
    expect(pages).toHaveLength(2);
    expect(pages[0]!.lineas).toHaveLength(PRODUCTOS_POR_HOJA_TAREA);
    expect(pages[1]!.lineas).toHaveLength(5);
  });
});