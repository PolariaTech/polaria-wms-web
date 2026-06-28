import { describe, expect, it } from "vitest";
import {
  buildPedidoProveedorN8nPayload,
  formatPedidoProveedorValidationError,
  parsePedidoProveedorBody,
  pedidoProveedorBodySchema,
} from "./pedido-proveedor.schema";

const VALID_BODY = {
  idOrdenCompra: "oc-1",
  idProveedor: "prov-1",
  lineas: [{ sku: "SKU-001", cantidad: 10, unidad: "kg" }],
  observaciones: "Entrega urgente",
};

describe("pedidoProveedorBodySchema", () => {
  it("acepta un payload válido", () => {
    const parsed = pedidoProveedorBodySchema.parse(VALID_BODY);

    expect(parsed).toEqual(VALID_BODY);
  });

  it("acepta observaciones omitidas", () => {
    const parsed = pedidoProveedorBodySchema.parse({
      idOrdenCompra: "oc-1",
      idProveedor: "prov-1",
      lineas: [{ sku: "SKU-001", cantidad: 2, unidad: "caja" }],
    });

    expect(parsed.observaciones).toBeUndefined();
  });

  it("rechaza body sin líneas", () => {
    const result = parsePedidoProveedorBody({
      idOrdenCompra: "oc-1",
      idProveedor: "prov-1",
      lineas: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatPedidoProveedorValidationError(result.error)).toContain(
        "al menos una línea",
      );
    }
  });

  it("rechaza cantidad no positiva", () => {
    const result = parsePedidoProveedorBody({
      ...VALID_BODY,
      lineas: [{ sku: "SKU-001", cantidad: 0, unidad: "kg" }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatPedidoProveedorValidationError(result.error)).toContain(
        "cantidad",
      );
    }
  });

  it("rechaza ids vacíos", () => {
    const result = parsePedidoProveedorBody({
      ...VALID_BODY,
      idOrdenCompra: "   ",
    });

    expect(result.success).toBe(false);
  });
});

describe("buildPedidoProveedorN8nPayload", () => {
  it("enriquece el payload para n8n", () => {
    const payload = buildPedidoProveedorN8nPayload(
      pedidoProveedorBodySchema.parse(VALID_BODY),
      "doc-123",
      "corr-456",
      "2026-06-28T12:00:00.000Z",
    );

    expect(payload).toEqual({
      ...VALID_BODY,
      documentId: "doc-123",
      correlationId: "corr-456",
      sentAt: "2026-06-28T12:00:00.000Z",
    });
  });
});
