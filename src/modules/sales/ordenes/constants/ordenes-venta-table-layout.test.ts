import { describe, expect, it } from "vitest";
import {
  ORDENES_VENTA_TABLE_MIN_WIDTH_CLASS,
  ordenVentaTableColumnClass,
} from "./ordenes-venta-table-layout";

describe("ordenVentaTableColumnClass", () => {
  it("tabla fija a ancho completo sin forzar scroll ni aplastar padding", () => {
    expect(ORDENES_VENTA_TABLE_MIN_WIDTH_CLASS).toBe("w-full table-fixed");
  });

  it("ORDEN DE COMPRA: header en una sola línea con truncate", () => {
    const header = ordenVentaTableColumnClass("occ", "header");
    expect(header).toContain("whitespace-nowrap");
    expect(header).toContain("truncate");
  });

  it("ORDEN DE COMPRA: celda con overflow para truncar el valor", () => {
    const cell = ordenVentaTableColumnClass("occ", "cell");
    expect(cell).toContain("overflow-hidden");
    expect(cell).not.toContain("whitespace-nowrap");
  });

  it("Acciones con ancho relativo y sin sticky", () => {
    const cell = ordenVentaTableColumnClass("acciones", "cell");
    expect(cell).toContain("w-[10%]");
    expect(cell).not.toContain("sticky");
  });
});
