import { describe, expect, it } from "vitest";
import {
  filterLogEntriesVisible,
  isLogEventoEnvioBodega,
} from "./filter-log-entries-visible";

describe("isLogEventoEnvioBodega", () => {
  it("detecta enviado a bodega", () => {
    expect(
      isLogEventoEnvioBodega({
        mensaje: "Pedido enviado a bodega (emitido) por Operador Tecno.",
      }),
    ).toBe(true);
  });

  it("detecta pedido emitido por…", () => {
    expect(
      isLogEventoEnvioBodega({
        mensaje: "Pedido emitido por Operador Tecno.",
      }),
    ).toBe(true);
  });

  it("no marca creación ni ediciones", () => {
    expect(
      isLogEventoEnvioBodega({
        mensaje: "Esta orden de trabajo fue creada por Operador Tecno.",
      }),
    ).toBe(false);
    expect(
      isLogEventoEnvioBodega({
        mensaje: "Orden de trabajo editada por Ana.",
      }),
    ).toBe(false);
  });
});

describe("filterLogEntriesVisible", () => {
  it("oculta solo envíos a bodega", () => {
    const rows = [
      {
        id: "1",
        createdAt: "2026-10-07T21:11:00.000Z",
        accion: "cambio_estado" as const,
        mensaje: "Pedido enviado a bodega (emitido) por Operador Tecno.",
        autor: "Operador Tecno",
        idOrdenTrabajo: null,
      },
      {
        id: "2",
        createdAt: "2026-10-07T21:10:00.000Z",
        accion: "creacion" as const,
        mensaje: "Esta orden de trabajo fue creada por Operador Tecno.",
        autor: "Operador Tecno",
        idOrdenTrabajo: null,
      },
    ];
    expect(filterLogEntriesVisible(rows).map((r) => r.id)).toEqual(["2"]);
  });
});
