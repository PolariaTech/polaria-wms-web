import { describe, expect, it } from "vitest";
import {
  labelMateoCoincidencia,
  resolveMateoCoincidencia,
} from "./mateo-coincidencia";

describe("mateo-coincidencia", () => {
  it("marca exacta cuando correo y mateo coinciden", () => {
    expect(
      resolveMateoCoincidencia({
        correo: "Alsteran",
        mateo: "Alsteran",
        usuario: "ALSTERAN S.A.S.",
      }),
    ).toBe("exacta");
  });

  it("marca similar con tokens compartidos", () => {
    expect(
      resolveMateoCoincidencia({
        correo: "vasos 9oz paquete",
        mateo: "Vaso desechable 9 oz x 50",
        usuario: "Pendiente",
      }),
    ).toBe("similar");
  });

  it("REQ-115: cebolla vs aguacate es sin coincidencia", () => {
    expect(
      resolveMateoCoincidencia({
        correo: "CEBOLLA BLANCA KG",
        mateo: "AGUACATE HASS EXTRA",
        usuario: "Pendiente",
      }),
    ).toBe("sin_coincidencia");
  });

  it("marca sin coincidencia si Mateo no propuso", () => {
    expect(
      resolveMateoCoincidencia({
        correo: "teclados del mismo de siempre",
        mateo: "",
        usuario: "",
        mateoSinPropuesta: true,
      }),
    ).toBe("sin_coincidencia");
  });

  it("marca no venía cuando el correo está vacío", () => {
    expect(
      resolveMateoCoincidencia({
        correo: "",
        mateo: "Unidad",
        usuario: "Unidad",
      }),
    ).toBe("no_venia");
  });

  it("etiqueta legible", () => {
    expect(labelMateoCoincidencia("exacta")).toBe("Exacta");
    expect(labelMateoCoincidencia("sin_coincidencia")).toBe(
      "Sin coincidencia (catálogo)",
    );
  });
});
