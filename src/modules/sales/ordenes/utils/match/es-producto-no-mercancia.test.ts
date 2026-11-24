import { describe, expect, it } from "vitest";
import { esProductoNoMercancia } from "./es-producto-no-mercancia";

describe("es-producto-no-mercancia", () => {
  it("detecta anticipos y servicios", () => {
    expect(esProductoNoMercancia({ nombre: "ANTICIPO CLIENTE", unidadMedida: "kg" })).toBe(
      true,
    );
    expect(esProductoNoMercancia({ nombre: "Aguacate Hass", unidadMedida: "kg" })).toBe(
      false,
    );
  });
});