import { describe, expect, it } from "vitest";
import {
  extractReporteIdFromEmbedUrl,
  normalizeEmbedUrl,
  resolveReporteIdFromEmbedUrl,
} from "./reporte-embed-url";

describe("reporte-embed-url", () => {
  it("saca el UUID de una URL de Looker Studio", () => {
    expect(
      extractReporteIdFromEmbedUrl(
        "https://lookerstudio.google.com/embed/reporting/8319190c-7a5c-48b2-9b1d-84701d583dd9/page/RMmyF",
      ),
    ).toBe("8319190c-7a5c-48b2-9b1d-84701d583dd9");
  });

  it("genera un id si la URL no trae UUID", () => {
    expect(
      resolveReporteIdFromEmbedUrl(
        "https://chatbot-mateo.vercel.app/reportes/ventas",
        () => "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      ),
    ).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
  });

  it("rechaza una URL inválida", () => {
    expect(() => normalizeEmbedUrl("looker-sin-protocolo")).toThrow(
      /URL válida/,
    );
  });
});
