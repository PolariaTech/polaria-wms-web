import { describe, expect, it } from "vitest";
import type { OrdenCompraRow } from "../types/purchases.types";
import {
  formatFechaOrden,
  formatObservacionOrden,
  nombresProductosOrden,
} from "./orden-compra-display";

const baseOrden: OrdenCompraRow = {
  id_orden_compra: "oc-1",
  codigo_cuenta: "CUENTA-01",
  id_bodega: "BOD-01",
  id_proveedor: "prov-1",
  proveedor_nombre: "Pat-lafrieda",
  id_solicitud_compra: null,
  id_creador: null,
  codigo: "OC-001",
  estado: "borrador",
  fecha_emision: "2026-07-01T15:00:00.000Z",
  fecha_entrega_estimada: null,
  destino_tipo: "interna",
  observaciones: null,
  created_at: "2026-07-01T15:00:00.000Z",
  updated_at: "2026-07-01T15:00:00.000Z",
  lineas: [
    {
      id_linea_orden_compra: "line-1",
      id_producto: "prod-1",
      cantidad: 300,
      producto: {
        sku: "OH2WF",
        descripcion: "Frozen-Lamb Racks",
        metadatos_catalogo: null,
      },
    },
  ],
};

describe("orden-compra-display", () => {
  it("nombresProductosOrden une títulos de líneas", () => {
    expect(nombresProductosOrden(baseOrden)).toBe("Frozen-Lamb Racks");
  });

  it("formatFechaOrden muestra solo fecha", () => {
    expect(formatFechaOrden(baseOrden.fecha_emision)).toMatch(/\d{2}-\d{2}-\d{4}/);
  });

  it("formatObservacionOrden devuelve guión si está vacío", () => {
    expect(formatObservacionOrden(null)).toBe("—");
    expect(formatObservacionOrden("Entrega muelle 3")).toBe("Entrega muelle 3");
  });
});
