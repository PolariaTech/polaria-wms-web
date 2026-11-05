import { describe, expect, it } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import { armarResumenImpresion } from "./resumen-impresion";

function item(id: string, extra: Partial<OrdenVentaOperadorRow>, ots: number[]) {
  return {
    row: { idOrdenVenta: id, venta: `OV-${id}`, comprador: "Hotel Sol", fechaEntrega: "2026-11-05", ...extra } as OrdenVentaOperadorRow,
    ots,
  };
}

const hoja = (id: string) => ({ idOrdenVenta: id }) as OrdenTareaAlmacenPrintData;

describe("armarResumenImpresion", () => {
  it("arma una fila por OV, en el orden recibido, con OT y hojas de cada una", () => {
    const resumen = armarResumenImpresion({
      orden: [item("b", { comprador: "Hotel Luna" }, [1, 2]), item("a", {}, [1])],
      hojas: [hoja("b"), hoja("b"), hoja("b"), hoja("a")],
      subtitulo: "Impresión rápida · entrega hasta 05/11/2026",
      generado: "Generado 05/11/2026 3:42 p. m.",
    });

    expect(resumen.titulo).toBe("Resumen de impresión");
    expect(resumen.subtitulo).toContain("entrega hasta 05/11/2026");
    expect(resumen.filas).toEqual([
      { venta: "OV-b", cliente: "Hotel Luna", entrega: "05/11/2026", ot: 2, hojas: 3 },
      { venta: "OV-a", cliente: "Hotel Sol", entrega: "05/11/2026", ot: 1, hojas: 1 },
    ]);
  });

  it("si el paquete se parte, cada fila dice en qué parte sale; sin partes no lleva ese dato", () => {
    const orden = [item("a", {}, [1]), item("b", {}, [1])];
    const hojas = [hoja("a"), hoja("b")];

    const partido = armarResumenImpresion({
      orden, hojas, subtitulo: "", generado: "",
      parteDeOv: new Map([["a", 1], ["b", 2]]),
    });
    const entero = armarResumenImpresion({ orden, hojas, subtitulo: "", generado: "" });

    expect(partido.filas.map((f) => f.parte)).toEqual([1, 2]);
    expect(entero.filas.every((f) => !("parte" in f))).toBe(true);
  });

  it("con OC: cada fila lleva las páginas de OC y las notas dicen lo que no se pudo imprimir", () => {
    const resumen = armarResumenImpresion({
      orden: [item("a", {}, [1]), item("b", {}, [1]), item("c", {}, [1])],
      hojas: [hoja("a"), hoja("b"), hoja("c")],
      subtitulo: "",
      generado: "",
      ocPorOv: new Map([
        ["a", { paginas: 3, avisos: [] }],
        ["b", { paginas: 0, avisos: ["lista.xlsx: pesa más de 10 MB."] }],
        ["c", { paginas: 0, avisos: [] }],
      ]),
    });

    expect(resumen.filas.map((f) => f.oc)).toEqual([3, undefined, undefined]);
    expect(resumen.notas).toEqual([
      "OV-b: lista.xlsx: pesa más de 10 MB.",
      "OV-c: no tiene OC para imprimir (adjuntos HTML, PDF o Excel).",
    ]);
  });

  it("una OV con OC y sin avisos no genera nota; sin OC en el paquete no hay columna ni notas", () => {
    const conOc = armarResumenImpresion({
      orden: [item("a", {}, [1])],
      hojas: [hoja("a")],
      subtitulo: "",
      generado: "",
      ocPorOv: new Map([["a", { paginas: 2, avisos: [] }]]),
    });
    const sinOc = armarResumenImpresion({ orden: [item("a", {}, [1])], hojas: [hoja("a")], subtitulo: "", generado: "" });

    expect(conOc.notas).toBeUndefined();
    expect(sinOc.notas).toBeUndefined();
    expect(sinOc.filas.every((f) => !("oc" in f))).toBe(true);
  });

  it("una OV sin fecha de entrega queda con la entrega vacía", () => {
    const resumen = armarResumenImpresion({
      orden: [item("a", { fechaEntrega: null }, [1])],
      hojas: [hoja("a")],
      subtitulo: "",
      generado: "",
    });

    expect(resumen.filas[0]?.entrega).toBe("");
  });

  it("si no llegan hojas de una OV cuenta una por OT en vez de dejar cero", () => {
    const resumen = armarResumenImpresion({
      orden: [item("a", {}, [1, 2, 3])],
      hojas: [],
      subtitulo: "",
      generado: "",
    });

    expect(resumen.filas[0]?.hojas).toBe(3);
  });
});
