import { describe, expect, it } from "vitest";
import { extractDireccionShipToDesdeTexto } from "./extract-direccion-ship-to";

describe("extractDireccionShipToDesdeTexto", () => {
  it("REQ-332: para el bloque al llegar Attn / Sent From", () => {
    expect(
      extractDireccionShipToDesdeTexto(
        [
          "Ship To:",
          "Waldorf Astoria CANCUN, MEXICO",
          "Carr Federal Libre 307, Cancun-Tulum, ROO, 77580, MX",
          "Attn: Antonio Porras",
          "Sent From: Waldorf Astoria CANCUN, MEXICO",
          "Qty: 10",
        ].join("\n"),
      ),
    ).toBe(
      "Waldorf Astoria CANCUN, MEXICO, Carr Federal Libre 307, Cancun-Tulum, ROO, 77580, MX",
    );
  });

  it("limpia Attn/Sent From cuando vienen en la misma línea con comas", () => {
    expect(
      extractDireccionShipToDesdeTexto(
        "Ship To: Waldorf Astoria CANCUN, MEXICO, Carr Federal Libre 307, Cancun-Tulum, ROO, 77580, MX, Attn: Antonio Porras, Sent From: Waldorf Astoria CANCUN, MEXICO",
      ),
    ).toBe(
      "Waldorf Astoria CANCUN, MEXICO, Carr Federal Libre 307, Cancun-Tulum, ROO, 77580, MX",
    );
  });
});
