import { describe, expect, it } from "vitest";
import {
  extractCorreoContactoDesdeTexto,
  formatCorreoChromeBlock,
  mergeCorreoChromeIntoTexto,
  parseCorreoChromeFromText,
  prependCorreoChromeToBody,
  resolveCabeceraCorreoPedido,
  withCorreoChromePreserved,
} from "./correo-chrome";

describe("correo-chrome", () => {
  it("parsea De / Para / Asunto", () => {
    const parsed = parseCorreoChromeFromText(
      [
        "De: Francisco <fmora@pamhotels.com>",
        "Para: pedidos@polaria.tech",
        "Asunto: HOTEL UNICO || OC 4502982532",
        "",
        "Buen día Estimado proveedor,",
      ].join("\n"),
    );
    expect(parsed.from).toContain("fmora@pamhotels.com");
    expect(parsed.subject).toContain("HOTEL UNICO");
    expect(parsed.body).toContain("Buen día");
  });

  it("withCorreoChromePreserved no pierde cabeceras al limpiar", () => {
    const raw = [
      "De: a@b.com",
      "Asunto: Pedido importante",
      "",
      "Necesitamos aguacate.",
    ].join("\n");
    const out = withCorreoChromePreserved(raw, (s) => s.trim());
    expect(out).toContain("De: a@b.com");
    expect(out).toContain("Asunto: Pedido importante");
    expect(out).toContain("Necesitamos aguacate");
  });

  it("mergeCorreoChromeIntoTexto prioriza cabeceras del .eml", () => {
    const eml = formatCorreoChromeBlock({
      from: "Francisco <fmora@pamhotels.com>",
      subject: "HOTEL UNICO || OC 4502982532",
    });
    const ia = "Buen día Estimado proveedor,";
    const out = mergeCorreoChromeIntoTexto(`${eml}\n\n${ia}`, ia);
    expect(out).toContain("fmora@pamhotels.com");
    expect(out).toContain("HOTEL UNICO");
    expect(out).toContain("Buen día");
  });

  it("prependCorreoChromeToBody antepone al cuerpo", () => {
    expect(
      prependCorreoChromeToBody(
        { from: "a@b.com", subject: "Hola" },
        "Cuerpo",
      ),
    ).toBe("De: a@b.com\nAsunto: Hola\n\nCuerpo");
  });

  it("extractCorreoContactoDesdeTexto prioriza el remitente De/From", () => {
    const text = [
      'De: "Arduizur Casquera Vargas" <asistadmin.kcc@krystal-hotels.com>',
      "Para: Ventas@aguacatesdepuebla.com",
      "Asunto: Pedido Limon y Aguacate",
      "",
      "Buen día,",
      "asistadmin.kcc@krystal-hotels.com<mailto:asistadmin.kcc@krystal-hotels.com>",
    ].join("\n");
    expect(extractCorreoContactoDesdeTexto(text)).toBe(
      "asistadmin.kcc@krystal-hotels.com",
    );
  });

  it("extractCorreoContactoDesdeTexto usa mailto si no hay De", () => {
    const text =
      "Saludos\nchef@hotel.com<mailto:chef@hotel.com>\nPara: Ventas@proveedor.com";
    expect(extractCorreoContactoDesdeTexto(text)).toBe("chef@hotel.com");
  });

  it("REQ-122: ignora From genérico BirchStreet y toma mail del cuerpo", () => {
    const text = [
      "De: BSS System <bss_system@birchstreet.net>",
      "Para: Ventas@aguacatesdepuebla.com",
      "Asunto: PO Fairmont",
      "",
      "Contacto: compras.mayakoba@fairmont.com",
      "Property: FAIRMONT MAYAKOBA",
    ].join("\n");
    expect(extractCorreoContactoDesdeTexto(text)).toBe(
      "compras.mayakoba@fairmont.com",
    );
  });

  it("REQ-239: resolveCabeceraCorreoPedido limpia dirección, correo y notas", () => {
    const origen = [
      "De: bss_system@birchstreet.net",
      "Sent By:",
      "Ixayana Cid",
      "Ixayana.Cid@Hilton.com",
      "Ship To: Kukulcan Km 17, Zona Hotelera",
      "CANCUN, ROO, 77500, MX",
      "Attn: Ixayana Cid",
    ].join("\n");
    const cabecera = resolveCabeceraCorreoPedido({
      origenTexto: origen,
      direccionModelo: "Otra, Attn: X, Sent From: Y",
      correoModelo: "CUNMC_CXP@Hilton.com",
      notas:
        "Horario de recepción: 8:00 AM a 2:00 PM. Pedido parcial no aceptado.",
    });
    expect(cabecera.direccion).toBe(
      "Kukulcan Km 17, Zona Hotelera, CANCUN, ROO, 77500, MX",
    );
    expect(cabecera.correo).toBe("Ixayana.Cid@Hilton.com");
    expect(cabecera.notas).toBe("Pedido parcial no aceptado.");
  });

  it("REQ-239: copia el remitente de Sent By y no el CONTACTO de facturación", () => {
    const text = [
      "De: bss_system@birchstreet.net",
      "Para: pedidos@aguacatesdepuebla.com",
      "Asunto: PO CUNMC0047780",
      "",
      "Sent By:",
      "Ixayana Cid",
      "",
      "NODEPT",
      "Hilton CANCUN MAR CARIBE ALL-INCLUSIVE RESORT, MEXICO",
      "Ixayana.Cid@Hilton.com",
      "",
      "CONTACTO: CUNMC_CXP@Hilton.com",
    ].join("\n");
    expect(extractCorreoContactoDesdeTexto(text)).toBe(
      "Ixayana.Cid@Hilton.com",
    );
  });
});
