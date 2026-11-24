import { describe, expect, it } from "vitest";
import { productoLabel, proveedorLabel } from "./solicitud-compra-create.helpers";

describe("solicitud-compra-create.helpers", () => {
  it("proveedorLabel combina proveedor y nombre distinto", () => {
    expect(proveedorLabel({ proveedor: "ACME", nombre: "Juan" } as never)).toBe(
      "ACME — Juan",
    );
    expect(proveedorLabel({ proveedor: "ACME", nombre: "ACME" } as never)).toBe(
      "ACME",
    );
  });

  it("productoLabel incluye SKU salvo el guion", () => {
    expect(productoLabel({ titulo: "Pollo", sku: "P1" } as never)).toBe(
      "Pollo · SKU P1",
    );
    expect(productoLabel({ titulo: "Pollo", sku: "—" } as never)).toBe("Pollo");
  });
});
