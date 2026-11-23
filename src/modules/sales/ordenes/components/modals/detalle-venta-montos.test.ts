import { describe, expect, it } from "vitest";
import type { OrdenVentaLineaRow } from "../../../shared/types/sales.types";
import { calcularMontosDetalle } from "./detalle-venta-montos";

const linea = (
  id: string,
  nombre: string,
  cantidad: number,
  precio: number,
): OrdenVentaLineaRow => ({
  id_linea_orden_venta: `l-${id}`,
  id_producto: id,
  cantidad_pedida: cantidad,
  precio_unitario: precio,
  producto: { sku: id, descripcion: nombre },
});

describe("calcularMontosDetalle", () => {
  it("sin notas: subtotal = cantidad × precio, IVA 0 y total = subtotal", () => {
    const lineas = [linea("a", "PAPAYA", 2, 10), linea("b", "MANGO", 1, 5)];
    const r = calcularMontosDetalle({
      lineItems: lineas,
      todasLineas: lineas,
      notasLineas: "",
      hija: null,
    });
    expect(r.subtotalOt).toBe(25);
    expect(r.ivaOt).toBe(0);
    expect(r.totalOt).toBe(25);
    expect(r.totalOv).toBe(25);
    expect(r.montosLinea).toHaveLength(2);
    expect(r.montosLinea[0]).toMatchObject({ titulo: expect.any(String), bruto: 20, iva: 0 });
  });

  it("la nota «IVA n %» de la línea suma IVA al total", () => {
    const lineas = [linea("a", "PAPAYA", 2, 10)];
    const r = calcularMontosDetalle({
      lineItems: lineas,
      todasLineas: lineas,
      notasLineas: "pid:a: IVA 16%",
      hija: null,
    });
    expect(r.ivaOt).toBeCloseTo(3.2);
    expect(r.totalOt).toBeCloseTo(23.2);
    expect(r.totalOv).toBeCloseTo(23.2);
  });

  it("el total de la OV usa todas las líneas aunque la OT muestre solo algunas", () => {
    const a = linea("a", "PAPAYA", 1, 10);
    const b = linea("b", "MANGO", 1, 7);
    const r = calcularMontosDetalle({
      lineItems: [a],
      todasLineas: [a, b],
      notasLineas: "",
      hija: null,
    });
    expect(r.totalOt).toBe(10);
    expect(r.totalOv).toBe(17);
  });

  it("sin líneas todo es 0", () => {
    const r = calcularMontosDetalle({
      lineItems: [],
      todasLineas: [],
      notasLineas: "",
      hija: null,
    });
    expect(r).toMatchObject({ subtotalOt: 0, ivaOt: 0, totalOt: 0, totalOv: 0, montosLinea: [] });
  });
});
