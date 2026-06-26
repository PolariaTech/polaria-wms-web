import { describe, expect, it } from "vitest";
import {
  formatInternationalPhoneDisplay,
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "./phone-countries";

describe("phone-countries", () => {
  it("valida teléfonos internacionales", () => {
    expect(isValidInternationalPhone("+573001234567")).toBe(true);
    expect(isValidInternationalPhone("+57")).toBe(false);
  });

  it("normaliza a formato E.164", () => {
    expect(normalizeInternationalPhone("+57 300 123 4567")).toBe("+573001234567");
  });

  it("formatea el teléfono para mostrar en tabla", () => {
    expect(formatInternationalPhoneDisplay("+573001234567")).toBe(
      "+57 300 1234567",
    );
    expect(formatInternationalPhoneDisplay(null)).toBe("—");
  });
});
