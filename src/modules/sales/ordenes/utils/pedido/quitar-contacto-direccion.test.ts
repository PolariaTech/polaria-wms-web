import { describe, expect, it } from "vitest";
import {
  quitarContactoDeDireccion,
  truncarMetaNoDireccion,
} from "./quitar-contacto-direccion";

describe("quitarContactoDeDireccion", () => {
  it("quita correos, fax y teléfonos entre comas", () => {
    expect(
      quitarContactoDeDireccion(
        "SLS Playa Mujeres, Fax:, Correo elec: ventas@a.com;fact@a.com, Isla Mujeres, QR",
      ),
    ).toBe("SLS Playa Mujeres, Isla Mujeres, QR");
  });

  it("deja intacta una dirección sin contacto", () => {
    expect(quitarContactoDeDireccion("Av. Kukulcan km 9, Cancún, QR 77500")).toBe(
      "Av. Kukulcan km 9, Cancún, QR 77500",
    );
  });

  it("devuelve null si solo queda contacto", () => {
    expect(quitarContactoDeDireccion("ventas@a.com")).toBeNull();
    expect(quitarContactoDeDireccion("Tel: 998 166 0605")).toBeNull();
    expect(quitarContactoDeDireccion(null)).toBeNull();
  });

  it("REQ-332: quita Attn y Sent From del Ship To BirchStreet/Waldorf", () => {
    expect(
      quitarContactoDeDireccion(
        "Waldorf Astoria CANCUN, MEXICO, Carr Federal Libre 307, Cancun-Tulum, ROO, 77580,, MX, Attn: Antonio Porras, Sent From: Waldorf Astoria CANCUN, MEXICO",
      ),
    ).toBe(
      "Waldorf Astoria CANCUN, MEXICO, Carr Federal Libre 307, Cancun-Tulum, ROO, 77580, MX",
    );
  });
});

describe("truncarMetaNoDireccion", () => {
  it("corta en Attn aunque no haya coma previa", () => {
    expect(
      truncarMetaNoDireccion(
        "Carr Federal 307 MX Attn: Antonio Porras Sent From: Hotel",
      ),
    ).toBe("Carr Federal 307 MX");
  });
});
