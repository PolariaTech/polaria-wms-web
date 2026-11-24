import { describe, expect, it } from "vitest";
import { fila, ingreso } from "../testing/correos.fixtures";
import {
  conErrorLocal,
  enProcesoLocal,
  motivoFallo,
  resumenLote,
} from "./correos-reintentar.helpers";

const base = fila({
  messageId: "m1",
  ingreso: ingreso({
    messageId: "m1",
    estado: "error",
    error: "viejo",
  }),
});

describe("correos-reintentar.helpers", () => {
  it("conErrorLocal fija estado error y el mensaje", () => {
    expect(conErrorLocal(base, "nuevo").ingreso).toMatchObject({
      estado: "error",
      error: "nuevo",
    });
  });

  it("enProcesoLocal limpia el error previo", () => {
    expect(enProcesoLocal(base).ingreso).toMatchObject({
      estado: "procesando",
      error: null,
    });
  });

  it("resumenLote distingue parcial y total", () => {
    const fallida = conErrorLocal(base, "sin renglones");
    expect(resumenLote(0, [fallida], 1)).toMatch(/1 de 1 fallaron.*sin renglones/);
    expect(resumenLote(2, [fallida], 3)).toMatch(/2 ingresados, 1 fallaron/);
  });

  it("motivoFallo usa fallback si no hay error", () => {
    expect(
      motivoFallo(
        ingreso({ messageId: "m", estado: "error", error: "  " }),
      ),
    ).toMatch(/terminó en error/i);
  });
});
