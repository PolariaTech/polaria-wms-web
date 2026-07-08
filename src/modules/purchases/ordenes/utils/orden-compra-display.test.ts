import { describe, expect, it } from "vitest";
import type { OrdenCompraRow } from "../../shared/types/purchases.types";
import {
  formatDestinoTipoOrden,
  formatFechaOrden,
  formatObservacionOrden,
  isOrdenDestinoListoParaEmitir,
  nombresProductosOrden,
  parseDestinoTipoOrden,
  toFechaOrdenInputValue,
  fechaOrdenInputToStorage,
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

  it("formatDestinoTipoOrden normaliza etiquetas", () => {
    expect(formatDestinoTipoOrden("interna")).toBe("Bodega interna");
    expect(formatDestinoTipoOrden("bodega_externa")).toBe("Bodega externa");
    expect(formatDestinoTipoOrden("bodega")).toBe("Bodega interna");
  });

  it("parseDestinoTipoOrden devuelve interna o externa", () => {
    expect(parseDestinoTipoOrden("bodega_interna")).toBe("interna");
    expect(parseDestinoTipoOrden("externa")).toBe("externa");
  });

  it("convierte fechas para input date", () => {
    expect(toFechaOrdenInputValue("2026-06-30T12:00:00.000Z")).toBe("2026-06-30");
    expect(fechaOrdenInputToStorage("2026-07-05")).toBe(
      "2026-07-05T12:00:00.000Z",
    );
  });

  it("isOrdenDestinoListoParaEmitir exige bodega destino", () => {
    expect(isOrdenDestinoListoParaEmitir(baseOrden)).toBe(true);
    expect(
      isOrdenDestinoListoParaEmitir({ ...baseOrden, id_bodega: "" }),
    ).toBe(false);
  });
});
