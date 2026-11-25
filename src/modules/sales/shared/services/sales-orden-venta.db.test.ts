import { describe, expect, it } from "vitest";
import type { OrdenVentaRow } from "../types/sales.types";
import {
  ORDEN_VENTA_COLUMNS,
  ORDEN_VENTA_OPERADOR_LIST_COLUMNS,
  parseCantidadKg,
  sortOrdenesVentaPorCreacionDesc,
} from "./sales-orden-venta.db";

describe("sales-orden-venta.db", () => {
  it("extiende las columnas del listado operador", () => {
    expect(ORDEN_VENTA_OPERADOR_LIST_COLUMNS.startsWith(ORDEN_VENTA_COLUMNS)).toBe(
      true,
    );
  });

  it("parseCantidadKg normaliza valores vacíos e inválidos", () => {
    expect(parseCantidadKg(null)).toBe(0);
    expect(parseCantidadKg("")).toBe(0);
    expect(parseCantidadKg("abc")).toBe(0);
    expect(parseCantidadKg("2.5")).toBe(2.5);
    expect(parseCantidadKg(3)).toBe(3);
  });

  it("ordena por creación descendente", () => {
    const rows = [
      { id_orden_venta: "a", created_at: "2026-01-01T00:00:00Z", fecha_pedido: "" },
      { id_orden_venta: "b", created_at: "2026-02-01T00:00:00Z", fecha_pedido: "" },
    ] as OrdenVentaRow[];
    expect(sortOrdenesVentaPorCreacionDesc(rows).map((r) => r.id_orden_venta)).toEqual([
      "b",
      "a",
    ]);
  });
});
