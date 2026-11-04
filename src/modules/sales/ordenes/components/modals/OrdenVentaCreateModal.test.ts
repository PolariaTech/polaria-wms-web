/**
 * Cobertura del subtítulo del CreateModal (REQ-220).
 * La lógica vive en orden-venta-create-modal-cabecera (extraída por tamaño).
 */
import { describe, expect, it } from "vitest";
import { descriptionCreateModalOv } from "./orden-venta-create-modal-cabecera";

describe("OrdenVentaCreateModal cabecera (REQ-220)", () => {
  it("no muestra «Folio … actualiza los datos del pedido» en edición", () => {
    const description = descriptionCreateModalOv({
      isEditing: true,
      step: "form",
      formDescription: "Captura manual",
      startMode: null,
    });
    expect(description).toBeUndefined();
    expect(description ?? "").not.toMatch(/actualiza los datos del pedido/i);
  });
});
