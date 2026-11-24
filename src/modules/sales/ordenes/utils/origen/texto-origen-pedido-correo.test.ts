import { describe, expect, it } from "vitest";
import {
  cleanCorreoBodyForNotas,
  isCuerpoMensajeFormato,
  serializeCuerpoMensaje,
} from "./texto-origen-pedido-correo";

describe("texto-origen-pedido-correo", () => {
  it("serializa y detecta formato de cuerpo", () => {
    const raw = serializeCuerpoMensaje([
      { tipo: "texto", texto: "Hola", filas: null },
    ]);
    expect(isCuerpoMensajeFormato(raw)).toBe(true);
    expect(cleanCorreoBodyForNotas("Buen día.\n\nGracias")).toContain("Buen día");
  });
});