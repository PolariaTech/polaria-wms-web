import { describe, expect, it } from "vitest";
import { textoFechaEntregaListado } from "./texto-fecha-entrega-listado";

describe("fecha de entrega en el listado (REQ-320/321)", () => {
  it("muestra fecha con día cuando la entrega ya está confirmada", () => {
    expect(
      textoFechaEntregaListado({
        estado: "confirmada",
        fechaEntrega: "2026-10-28T15:00:00.000Z",
      }),
    ).toBe("28-OCT-2026 (MIÉRCOLES)");
  });

  it("deja la celda vacía si la orden confirmada no tiene fecha", () => {
    expect(
      textoFechaEntregaListado({
        estado: "confirmada",
        fechaEntrega: "  ",
        origenCorreo: [{ Fecha: "2026-11-02" }],
      }),
    ).toBe("");
  });

  it("en por confirmar usa la fecha ya guardada, con día", () => {
    expect(
      textoFechaEntregaListado({
        estado: "por_confirmar",
        fechaEntrega: "2026-11-03",
        origenCorreo: [{ Fecha: "2026-11-09" }],
      }),
    ).toBe("03-NOV-2026 (MARTES)");
  });

  it("en por confirmar sin fecha guardada muestra la tentativa del correo", () => {
    expect(
      textoFechaEntregaListado({
        estado: "por_confirmar",
        fechaEntrega: null,
        origenCorreo: [{ Fecha: "01/11/2026" }],
      }),
    ).toBe("01-NOV-2026 (DOMINGO)");
  });

  it("deja la celda vacía si tampoco hay tentativa", () => {
    expect(
      textoFechaEntregaListado({
        estado: "por_confirmar",
        fechaEntrega: "",
        origenCorreo: [],
      }),
    ).toBe("");
  });
});
