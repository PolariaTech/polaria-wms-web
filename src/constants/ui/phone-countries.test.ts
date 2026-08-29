import { describe, expect, it } from "vitest";
import {
  formatInternationalPhoneDisplay,
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "./phone-countries";

describe("phone-countries", () => {
  it("valida teléfonos internacionales y locales con país por defecto", () => {
    expect(isValidInternationalPhone("+573001234567")).toBe(true);
    expect(isValidInternationalPhone("573001234567")).toBe(true);
    expect(isValidInternationalPhone("3001234567")).toBe(true);
    expect(isValidInternationalPhone("+57")).toBe(false);
  });

  it("normaliza a formato E.164 con prefijo de país", () => {
    expect(normalizeInternationalPhone("+57 300 123 4567")).toBe("+573001234567");
    expect(normalizeInternationalPhone("573001234567")).toBe("+573001234567");
    expect(normalizeInternationalPhone("3001234567")).toBe("+573001234567");
  });

  it("formatea el teléfono para mostrar siempre el fijo del país", () => {
    expect(formatInternationalPhoneDisplay("+573001234567")).toBe(
      "+57 300 1234567",
    );
    expect(formatInternationalPhoneDisplay("573001112238")).toBe(
      "+57 300 1112238",
    );
    expect(formatInternationalPhoneDisplay("3001234567")).toBe(
      "+57 300 1234567",
    );
    expect(formatInternationalPhoneDisplay(null)).toBe("—");
  });
});
