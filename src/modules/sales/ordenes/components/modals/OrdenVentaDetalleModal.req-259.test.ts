import { describe, expect, it } from "vitest";

/** Labels de identidad cliente en detalle (REQ-259). */
const LABELS_IDENTIDAD_CLIENTE_DETALLE = [
  "Cliente",
  "Código de cliente",
  "Denominación comercial",
  "RFC",
] as const;

describe("OrdenVentaDetalleModal REQ-259", () => {
  it("incluye RFC en la identidad del cliente del detalle", () => {
    expect(LABELS_IDENTIDAD_CLIENTE_DETALLE).toContain("RFC");
    expect(LABELS_IDENTIDAD_CLIENTE_DETALLE.indexOf("RFC")).toBe(
      LABELS_IDENTIDAD_CLIENTE_DETALLE.indexOf("Denominación comercial") + 1,
    );
  });
});
