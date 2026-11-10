import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrdenVentaModalReadonlyBody } from "./orden-venta-modal-readonly-body";

describe("OrdenVentaModalReadonlyBody (REQ-180)", () => {
  it("deshabilita el fieldset en solo lectura", () => {
    const { container } = render(
      <OrdenVentaModalReadonlyBody soloLectura>
        <input aria-label="campo" />
      </OrdenVentaModalReadonlyBody>,
    );
    expect(container.querySelector("fieldset")).toBeDisabled();
    expect(screen.getByLabelText("campo")).toBeDisabled();
  });
});
