import { describe, expect, it } from "vitest";
import {
  extractCorreoContactoDesdeTexto,
  formatCorreoChromeBlock,
  isCorreoRemitenteGenerico,
  mergeCorreoChromeIntoTexto,
  parseCorreoChromeFromText,
  prependCorreoChromeToBody,
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
});

describe("extractCorreoContactoDesdeTexto — correo del proveedor (REQ-310)", () => {
  const ocBirchStreet = [
    "De: <bss_system@birchstreet.net>",
    "Para: <ventas@aguacatesdepuebla.com>",
    "",
    "PO NUMBER : CUNQR0000001 Status: Fax/email/csv accepted",
    "Supplier: Proveedor de Prueba SA de CV(Direct)",
    "Calle Falsa 123",
    "Email: facturacion@aguacatesdepuebla.com",
    "Bill To: Hotel Ejemplo CANCUN, MEXICO",
    "Ship To: Hotel Ejemplo CANCUN, MEXICO",
    "Sent From: Hotel Ejemplo CANCUN, MEXICO",
    "Calle Otra 456",
    "Email: compras@ejemplo.com",
  ].join("\n");

  it("toma el correo del comprador (Sent From), no el Email del bloque Supplier", () => {
    expect(extractCorreoContactoDesdeTexto(ocBirchStreet)).toBe("compras@ejemplo.com");
  });

  it("no devuelve un correo del proveedor aunque sea el único etiquetado", () => {
    const soloProveedor = [
      "De: <bss_system@birchstreet.net>",
      "Supplier: Proveedor de Prueba SA de CV(Direct)",
      "Email: facturacion@aguacatesdepuebla.com",
      "Bill To: Hotel Ejemplo",
    ].join("\n");
    const correo = extractCorreoContactoDesdeTexto(soloProveedor);
    expect(correo ?? "").not.toMatch(/aguacatesdepuebla/i);
  });

  it("un De: del dominio del proveedor tampoco es el contacto", () => {
    const texto = "De: <facturacion@aguacatesdepuebla.com>\n\nPedido 5 kilos de tomate";
    expect(extractCorreoContactoDesdeTexto(texto)).toBeNull();
  });

  it("control: un De: de un comprador sigue siendo el contacto", () => {
    const texto = "De: <cocina@ejemplo.com>\n\nPedido 5 kilos de tomate";
    expect(extractCorreoContactoDesdeTexto(texto)).toBe("cocina@ejemplo.com");
  });

  it("control: sin bloque Supplier toma el Email: etiquetado de siempre", () => {
    const texto = ["De: <bss_system@birchstreet.net>", "Email: compras@ejemplo.com"].join("\n");
    expect(extractCorreoContactoDesdeTexto(texto)).toBe("compras@ejemplo.com");
  });

  it("isCorreoRemitenteGenerico incluye todo el dominio del proveedor", () => {
    expect(isCorreoRemitenteGenerico("facturacion@aguacatesdepuebla.com")).toBe(true);
    expect(isCorreoRemitenteGenerico("compras@ejemplo.com")).toBe(false);
  });
});
