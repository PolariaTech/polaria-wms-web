import { describe, expect, it } from "vitest";
import {
  altaFormStateFromDetalle,
  displayAltaValue,
  emptyAltaFormState,
  fichaFromAltaForm,
  parseCompradorAltaFicha,
} from "./comprador-alta";

describe("parseCompradorAltaFicha", () => {
  it("devuelve ficha vacía si el valor no es un objeto", () => {
    const ficha = parseCompradorAltaFicha(null);
    expect(ficha.razonSocial).toBe("");
    expect(ficha.centros).toEqual([]);
    expect(ficha.complementoPago).toBe(false);
  });

  it("lee centros y contactos del json de alta", () => {
    const ficha = parseCompradorAltaFicha({
      razonSocial: "Hotel Xcaret SA",
      rfc: "EXC980411R32",
      complementoPago: true,
      centros: [{ nombre: "Cocina de banquetes", direccion: "Km 282" }],
      contactos: [{ nombre: "Chef Uc", rol: "Hace pedidos", telefono: "" }],
    });

    expect(ficha.razonSocial).toBe("Hotel Xcaret SA");
    expect(ficha.rfc).toBe("EXC980411R32");
    expect(ficha.complementoPago).toBe(true);
    expect(ficha.centros[0]?.nombre).toBe("Cocina de banquetes");
    expect(ficha.contactos[0]?.nombre).toBe("Chef Uc");
  });
});

describe("displayAltaValue", () => {
  it("muestra raya cuando el texto viene vacío", () => {
    expect(displayAltaValue("")).toBe("—");
    expect(displayAltaValue(true)).toBe("Sí");
    expect(displayAltaValue(false)).toBe("No");
  });
});

describe("altaFormStateFromDetalle", () => {
  it("rellena centros vacíos y quita las keys al guardar", () => {
    const form = altaFormStateFromDetalle(
      "Hotel Xcaret",
      "+529981112233",
      parseCompradorAltaFicha({
        razonSocial: "Hotel Xcaret SA",
        centros: [{ nombre: "Cocina de banquetes" }],
      }),
    );

    expect(form.nombreComercial).toBe("Hotel Xcaret");
    expect(form.ficha.centros[0]?.nombre).toBe("Cocina de banquetes");
    expect(form.ficha.centros[0]?.key).toBeTruthy();
    expect(form.ficha.contactos).toHaveLength(1);
    expect(form.ficha.usoCfdi).toBe(emptyAltaFormState().ficha.usoCfdi);

    const ficha = fichaFromAltaForm(form);
    expect(ficha.razonSocial).toBe("Hotel Xcaret SA");
    expect(ficha.centros[0]).toEqual(
      expect.objectContaining({ nombre: "Cocina de banquetes" }),
    );
    expect(ficha.centros[0]).not.toHaveProperty("key");
    expect(ficha.contactos[0]).not.toHaveProperty("key");
  });
});
