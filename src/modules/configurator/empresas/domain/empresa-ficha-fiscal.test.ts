import { describe, expect, it } from "vitest";
import {
  FICHA_EN_BLANCO,
  LOGO_MAX_BYTES,
  mensajeFicha,
  mensajeLogo,
} from "./empresa-ficha-fiscal";

describe("mensajeFicha", () => {
  it("acepta la ficha vacía", () => {
    expect(mensajeFicha(FICHA_EN_BLANCO)).toBeNull();
  });

  it("acepta RFC, código postal y CLABE con cualquier texto", () => {
    expect(
      mensajeFicha({
        ...FICHA_EN_BLANCO,
        rfc: "APU2103256",
        codigoPostalExpedicion: "7756",
        clabe: "123",
      }),
    ).toBeNull();
  });

  it("acepta la CLABE de 18 dígitos de la factura", () => {
    expect(
      mensajeFicha({ ...FICHA_EN_BLANCO, clabe: "012528001186364430" }),
    ).toBeNull();
  });
});

describe("mensajeLogo", () => {
  it("rechaza un archivo de 1048577 bytes", () => {
    expect(
      mensajeLogo({ size: LOGO_MAX_BYTES + 1, type: "image/jpeg" }),
    ).toBe("El logo supera 1 MB.");
  });

  it("acepta un PNG de 1 MB", () => {
    expect(mensajeLogo({ size: LOGO_MAX_BYTES, type: "image/png" })).toBeNull();
  });
});
