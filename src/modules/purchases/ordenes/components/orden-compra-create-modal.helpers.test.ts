import { describe, expect, it } from "vitest";
import {
  productoLabel,
  proveedorLabel,
  todayInputValue,
} from "./orden-compra-create-modal.helpers";

describe("orden-compra-create-modal.helpers", () => {
  it("todayInputValue devuelve YYYY-MM-DD", () => {
    expect(todayInputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("proveedorLabel combina proveedor y nombre distinto", () => {
    expect(
      proveedorLabel({ proveedor: "ACME", nombre: "Juan" } as never),
    ).toBe("ACME — Juan");
    expect(
      proveedorLabel({ proveedor: "ACME", nombre: "ACME" } as never),
    ).toBe("ACME");
  });

  it("productoLabel incluye SKU salvo el guion", () => {
    expect(productoLabel({ titulo: "Pollo", sku: "P1" } as never)).toBe(
      "Pollo · SKU P1",
    );
    expect(productoLabel({ titulo: "Pollo", sku: "—" } as never)).toBe("Pollo");
  });
});
