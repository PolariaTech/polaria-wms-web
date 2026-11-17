import { afterEach, describe, expect, it } from "vitest";
import { guardarRecorrido, leerRecorrido } from "./recorrido-correos";

describe("recorrido-correos (REQ-317)", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("guarda y lee el bloque de ids con su modo", () => {
    guardarRecorrido({ modo: "descartados", ids: ["a", "b", "c"] });
    expect(leerRecorrido()).toEqual({ modo: "descartados", ids: ["a", "b", "c"] });
  });

  it("ignora un valor que no es un recorrido", () => {
    sessionStorage.setItem("polaria.ventas.correos.recorrido", "{no-json");
    expect(leerRecorrido()).toBeNull();
    sessionStorage.setItem(
      "polaria.ventas.correos.recorrido",
      JSON.stringify({ modo: "otro", ids: ["a"] }),
    );
    expect(leerRecorrido()).toBeNull();
    sessionStorage.setItem(
      "polaria.ventas.correos.recorrido",
      JSON.stringify({ modo: "todos", ids: [1] }),
    );
    expect(leerRecorrido()).toBeNull();
  });

  it("sin nada guardado no hay recorrido", () => {
    expect(leerRecorrido()).toBeNull();
  });
});
