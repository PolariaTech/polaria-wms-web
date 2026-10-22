import { describe, expect, it } from "vitest";
import {
  formatCorreoChromeBlock,
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
});
