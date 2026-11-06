import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrdenVentaCypherDrawer } from "./OrdenVentaCypherDrawer";

vi.mock("./CypherOrigenAdjuntosBlock", () => ({
  CypherOrigenAdjuntosBlock: () => (
    <div data-testid="cypher-origen-adjuntos-block" />
  ),
}));

describe("OrdenVentaCypherDrawer", () => {
  it("no monta el panel si falta id de OV o cuenta", () => {
    const { container } = render(
      <OrdenVentaCypherDrawer
        idOrdenVenta={null}
        codigoCuenta={null}
        row={null}
        busyKind={null}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onPrint={vi.fn()}
        onPreview={vi.fn()}
        onFotos={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
