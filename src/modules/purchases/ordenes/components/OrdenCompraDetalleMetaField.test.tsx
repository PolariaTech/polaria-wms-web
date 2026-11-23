import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrdenCompraDetalleMetaField } from "./OrdenCompraDetalleMetaField";

describe("OrdenCompraDetalleMetaField", () => {
  it("renderiza etiqueta y contenido", () => {
    render(
      <OrdenCompraDetalleMetaField label="Proveedor">ACME</OrdenCompraDetalleMetaField>,
    );

    expect(screen.getByText("Proveedor")).toBeInTheDocument();
    expect(screen.getByText("ACME")).toBeInTheDocument();
  });
});
