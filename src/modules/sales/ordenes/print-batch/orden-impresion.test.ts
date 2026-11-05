import { describe, expect, it } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import { ordenarHojasPorEntrega } from "./orden-impresion";

function hoja(id: string, fechaEntrega: string, horaEntrega: string): OrdenTareaAlmacenPrintData {
  return { folio: id, fechaEntrega, horaEntrega } as OrdenTareaAlmacenPrintData;
}

const ids = (hojas: readonly OrdenTareaAlmacenPrintData[]) => hojas.map((h) => h.folio);

describe("ordenarHojasPorEntrega", () => {
  it("ordena por fecha de entrega, de la más próxima a la más lejana", () => {
    const res = ordenarHojasPorEntrega([
      hoja("c", "08/11/2026", ""),
      hoja("a", "06/11/2026", ""),
      hoja("b", "07/11/2026", ""),
    ]);
    expect(ids(res)).toEqual(["a", "b", "c"]);
  });

  it("compara año y mes antes que el día (no como texto)", () => {
    const res = ordenarHojasPorEntrega([
      hoja("dic", "02/12/2026", ""),
      hoja("ene", "30/01/2027", ""),
      hoja("nov", "28/11/2026", ""),
    ]);
    expect(ids(res)).toEqual(["nov", "dic", "ene"]);
  });

  it("en el mismo día ordena por la hora en que empieza la ventana", () => {
    const res = ordenarHojasPorEntrega([
      hoja("tarde", "06/11/2026", "14:00 – 16:00"),
      hoja("temprano", "06/11/2026", "06:30 – 09:00"),
      hoja("medio", "06/11/2026", "9:15"),
    ]);
    expect(ids(res)).toEqual(["temprano", "medio", "tarde"]);
  });

  it("las hojas sin fecha o sin hora van después de las que sí la tienen", () => {
    const res = ordenarHojasPorEntrega([
      hoja("sin-fecha", "", "06:00"),
      hoja("sin-hora", "06/11/2026", "mañana"),
      hoja("completa", "06/11/2026", "06:00"),
      hoja("texto-libre", "pronto", ""),
    ]);
    expect(ids(res)).toEqual(["completa", "sin-hora", "sin-fecha", "texto-libre"]);
  });

  it("a igual fecha y hora conserva el orden recibido y no separa las hojas de una OT", () => {
    const res = ordenarHojasPorEntrega([
      hoja("b-1", "06/11/2026", "08:00"),
      hoja("b-2", "06/11/2026", "08:00"),
      hoja("a-1", "06/11/2026", "08:00"),
    ]);
    expect(ids(res)).toEqual(["b-1", "b-2", "a-1"]);
  });

  it("no modifica la lista original", () => {
    const original = [hoja("b", "07/11/2026", ""), hoja("a", "06/11/2026", "")];
    ordenarHojasPorEntrega(original);
    expect(ids(original)).toEqual(["b", "a"]);
  });
});
