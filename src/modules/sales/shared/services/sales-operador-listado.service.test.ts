import { describe, expect, it } from "vitest";
import type { OvSlaConfig } from "../utils/ov-sla";
import type { OrdenVentaOperadorListRow } from "./sales-orden-venta.db";
import {
  countOrdenesVentaPorConfirmar,
  getOrdenVentaOperadorById,
  listOrdenesVenta,
  listOrdenesVentaOperador,
  listOrdenesVentaOperadorParaJefe,
  mapOrdenVentaOperadorRow,
} from "./sales-operador-listado.service";

describe("sales-operador-listado.service", () => {
  it("exporta la API pública de listados", () => {
    expect(typeof listOrdenesVenta).toBe("function");
    expect(typeof listOrdenesVentaOperador).toBe("function");
    expect(typeof listOrdenesVentaOperadorParaJefe).toBe("function");
    expect(typeof countOrdenesVentaPorConfirmar).toBe("function");
    expect(typeof getOrdenVentaOperadorById).toBe("function");
  });

  it("mapOrdenVentaOperadorRow usa valores por defecto sin resumen", () => {
    const row = {
      id_orden_venta: "ov1",
      codigo: "OV-1",
      codigo_cuenta: "CTA",
      id_bodega: "b1",
      id_bodega_destino: null,
      id_comprador: null,
      estado: "por_confirmar",
      created_at: "2026-01-01T00:00:00Z",
      fecha_pedido: "2026-01-01",
    } as unknown as OrdenVentaOperadorListRow;

    const mapped = mapOrdenVentaOperadorRow(
      row,
      new Map(),
      new Map(),
      new Map(),
      new Map<string, OvSlaConfig>(),
    );

    expect(mapped.idOrdenVenta).toBe("ov1");
    expect(mapped.comprador).toBe("—");
    expect(mapped.destino).toBe("—");
    expect(mapped.productos).toBe("—");
    expect(mapped.cantidadKg).toBe(0);
  });
});
