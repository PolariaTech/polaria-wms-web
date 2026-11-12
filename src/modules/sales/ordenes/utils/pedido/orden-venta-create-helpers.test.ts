import { describe, expect, it } from "vitest";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import {
  applyProductoToLinea,
  collectSugerenciasLinea,
  fieldControlClass,
  formatBodegaDestinoOption,
  formatPrecioInput,
  formatProductoNombreConSku,
  lineAmounts,
  resolveBodegaDestinoInicial,
  suggestFromCatalogo,
  toDateInputValue,
} from "./orden-venta-create-helpers";

function linea(partial: Partial<LineaVentaForm> = {}): LineaVentaForm {
  return {
    idProducto: "",
    nombre: "",
    codigo: "",
    idBodega: "",
    cantidadInput: "",
    cajasInput: "",
    presentacion: "",
    especificacion: "",
    ivaPct: "0",
    kgDisponible: 0,
    unidadMedida: "kg",
    precioUnitario: 0,
    precioInput: "",
    ...partial,
  };
}

function producto(partial: Partial<ProductoVentaOption> = {}): ProductoVentaOption {
  return {
    idProducto: "p1",
    label: "Aguacate (AGU)",
    idCliente: null,
    idBodega: "b1",
    codigo: "AGU",
    nombre: "Aguacate",
    kgDisponible: 10,
    precioUnitario: 40,
    unidadMedida: "kg",
    ...partial,
  };
}

describe("formatProductoNombreConSku", () => {
  it("arma nombre y sku", () => {
    expect(formatProductoNombreConSku("Aguacate", "AGU")).toBe("Aguacate (AGU)");
  });

  it("no repite un sku que ya está en el nombre", () => {
    expect(formatProductoNombreConSku("Aguacate (AGU)", "AGU")).toBe(
      "Aguacate (AGU)",
    );
  });

  it("devuelve vacío si no hay nombre ni sku", () => {
    expect(formatProductoNombreConSku("  ", "—")).toBe("");
  });
});

describe("lineAmounts", () => {
  it("calcula bruto e iva sin descuento (REQ-218)", () => {
    expect(
      lineAmounts(
        linea({
          cantidadInput: "2",
          precioUnitario: 10,
          ivaPct: "16",
        }),
      ),
    ).toEqual({
      bruto: 20,
      base: 20,
      iva: 3.2,
      importe: 20,
    });
  });
});

describe("resolveBodegaDestinoInicial", () => {
  const rows = [
    { idBodega: "a", label: "A" },
    { idBodega: "b", label: "B" },
  ];

  it("usa el default cuando está en la lista", () => {
    expect(resolveBodegaDestinoInicial(rows, "b")).toBe("b");
  });

  it("elige la única bodega si no hay default", () => {
    expect(resolveBodegaDestinoInicial([rows[0]!], null)).toBe("a");
  });

  it("deja vacío si hay varias y el default no está", () => {
    expect(resolveBodegaDestinoInicial(rows, "z")).toBe("");
  });
});

describe("formatBodegaDestinoOption", () => {
  it("agrega el tipo solo cuando se pide", () => {
    const bodega = { idBodega: "a", nombre: "Frío", codigo: "F1" };
    expect(formatBodegaDestinoOption(bodega, "interna", false).label).toBe(
      "Frío (F1)",
    );
    expect(formatBodegaDestinoOption(bodega, "externa", true).label).toBe(
      "Frío (F1) · externa",
    );
  });
});

describe("fieldControlClass", () => {
  it("prioriza el faltante sobre el aviso y el autollenado", () => {
    expect(
      fieldControlClass({
        field: "direccion",
        missingFields: new Set(["direccion"]),
        warnFields: new Set(["direccion"]),
        autoFields: new Set(["direccion"]),
      }),
    ).toBe("!border-polaria-danger-border !bg-polaria-danger-bg");
  });
});

describe("collectSugerenciasLinea", () => {
  it("junta la sugerencia y las alternativas sin repetir", () => {
    const sug = {
      idProducto: "p1",
      nombre: "A",
      codigo: "A",
      idBodega: "b",
      kgDisponible: 1,
      unidadMedida: "kg",
      precioUnitario: 1,
    };
    expect(
      collectSugerenciasLinea(
        linea({
          sugerencia: sug,
          sugerenciasAlternativas: [sug, { ...sug, idProducto: "p2" }],
        }),
      ).map((row) => row.idProducto),
    ).toEqual(["p1", "p2"]);
  });
});

describe("formatPrecioInput", () => {
  it("deja vacío el cero y lo que no es número", () => {
    expect(formatPrecioInput(0)).toBe("");
    expect(formatPrecioInput(Number.NaN)).toBe("");
  });
});

describe("toDateInputValue", () => {
  it("recorta un ISO y convierte una fecha con barras", () => {
    expect(toDateInputValue("2026-10-26T15:00:00")).toBe("2026-10-26");
    expect(toDateInputValue("10/26/2026")).toBe("2026-10-26");
    expect(toDateInputValue("")).toBe("");
  });

  it("recorta un ISO con hora y zona, y deja vacío un valor en blanco", () => {
    expect(toDateInputValue("2026-11-04T12:00:00.000Z")).toBe("2026-11-04");
    expect(toDateInputValue("  ")).toBe("");
  });
});

describe("applyProductoToLinea", () => {
  it("respeta un precio escrito a mano", () => {
    const next = applyProductoToLinea(
      linea({
        precioManual: true,
        precioUnitario: 12,
        precioInput: "12",
        catalogPending: true,
      }),
      producto({ precioUnitario: 40 }),
    );
    expect(next.precioUnitario).toBe(12);
    expect(next.precioInput).toBe("12");
    expect(next.catalogPending).toBe(false);
    expect(next.idProducto).toBe("p1");
  });
});

describe("suggestFromCatalogo", () => {
  it("no sugiere si el catálogo está vacío", () => {
    expect(suggestFromCatalogo("aguacate", [])).toEqual({
      sugerencia: null,
      sugerenciasAlternativas: [],
      catalogAmbiguo: false,
    });
  });
});
