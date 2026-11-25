import { describe, expect, it } from "vitest";
import {
  FICHA_EN_BLANCO,
  LOGO_MAX_BYTES,
  fichaParaGuardar,
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

  it("acepta el régimen 601 y el vacío, y rechaza 12", () => {
    expect(mensajeFicha({ ...FICHA_EN_BLANCO, regimenFiscal: "601" })).toBeNull();
    expect(mensajeFicha({ ...FICHA_EN_BLANCO, regimenFiscal: "" })).toBeNull();
    expect(mensajeFicha({ ...FICHA_EN_BLANCO, regimenFiscal: "12" })).toBe(
      "El régimen fiscal no es válido.",
    );
  });

  it("acepta a@b.c y rechaza un correo sin punto o con espacio", () => {
    expect(mensajeFicha({ ...FICHA_EN_BLANCO, correoCobranza: "a@b.c" })).toBeNull();
    expect(mensajeFicha({ ...FICHA_EN_BLANCO, correoCobranza: "" })).toBeNull();
    expect(mensajeFicha({ ...FICHA_EN_BLANCO, correoCobranza: "a@b" })).toBe(
      "El correo de cobranza no es válido.",
    );
    expect(mensajeFicha({ ...FICHA_EN_BLANCO, correoCobranza: "a b@c.com" })).toBe(
      "El correo de cobranza no es válido.",
    );
  });

  it("deja pasar cualquier texto en RFC, CP, CLABE, cuenta, banco y serie, y el vacío queda null", () => {
    const campos = {
      ...FICHA_EN_BLANCO,
      rfc: "APU2103256",
      codigoPostalExpedicion: "7756",
      nombreCuentaBancaria: "Cuenta 1",
      banco: "BBVA",
      clabe: "123",
      serieFactura: "CS-",
    };
    expect(mensajeFicha(campos)).toBeNull();
    expect(fichaParaGuardar(campos)).toMatchObject({
      rfc: "APU2103256",
      codigoPostalExpedicion: "7756",
      nombreCuentaBancaria: "Cuenta 1",
      banco: "BBVA",
      clabe: "123",
      serieFactura: "CS-",
    });
    expect(fichaParaGuardar(FICHA_EN_BLANCO)).toEqual({
      rfc: null,
      regimenFiscal: null,
      codigoPostalExpedicion: null,
      nombreCuentaBancaria: null,
      banco: null,
      clabe: null,
      correoCobranza: null,
      serieFactura: null,
    });
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

  it("rechaza un GIF", () => {
    expect(mensajeLogo({ size: 12, type: "image/gif" })).toBe(
      "El logo debe ser JPEG o PNG.",
    );
  });
});
