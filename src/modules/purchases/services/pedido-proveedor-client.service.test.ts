import { describe, expect, it, vi } from "vitest";
import type { OrdenCompraRow } from "../types/purchases.types";
import {
  buildPedidoProveedorRequest,
  notifyProveedorPedido,
} from "./pedido-proveedor-client.service";

const ORDEN: OrdenCompraRow = {
  id_orden_compra: "oc-1",
  codigo_cuenta: "CUENTA-01",
  id_bodega: "BOD-01",
  id_proveedor: "prov-1",
  id_solicitud_compra: "sol-1",
  id_creador: "user-1",
  codigo: "OC-001",
  estado: "emitida",
  fecha_emision: "2026-06-28T12:00:00.000Z",
  fecha_entrega_estimada: null,
  destino_tipo: "bodega",
  observaciones: "Entrega programada",
  created_at: "2026-06-28T12:00:00.000Z",
  updated_at: "2026-06-28T12:00:00.000Z",
};

describe("pedido-proveedor-client.service", () => {
  it("buildPedidoProveedorRequest arma payload de la OC", () => {
    expect(
      buildPedidoProveedorRequest(ORDEN, [
        { sku: "SKU-001", cantidad: 5, unidad: "kg" },
      ]),
    ).toEqual({
      idOrdenCompra: "oc-1",
      idProveedor: "prov-1",
      lineas: [{ sku: "SKU-001", cantidad: 5, unidad: "kg" }],
      observaciones: "Entrega programada — OC OC-001",
    });
  });

  it("notifyProveedorPedido llama POST /api/pedido-proveedor", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          n8nStatus: 200,
          correlationId: "corr-1",
        }),
      }),
    );

    const result = await notifyProveedorPedido({
      idOrdenCompra: "oc-1",
      idProveedor: "prov-1",
      lineas: [{ sku: "SKU-001", cantidad: 5, unidad: "kg" }],
    });

    expect(fetch).toHaveBeenCalledWith("/api/pedido-proveedor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idOrdenCompra: "oc-1",
        idProveedor: "prov-1",
        lineas: [{ sku: "SKU-001", cantidad: 5, unidad: "kg" }],
      }),
    });
    expect(result.correlationId).toBe("corr-1");
  });
});
