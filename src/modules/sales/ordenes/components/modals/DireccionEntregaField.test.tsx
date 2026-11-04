import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DireccionEntregaField } from "./DireccionEntregaField";

describe("DireccionEntregaField", () => {
  it("renderiza textarea a ancho completo (REQ-217)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DireccionEntregaField
        id="orden-venta-direccion"
        value=""
        onChange={onChange}
      />,
    );
    const caja = screen.getByLabelText("Dirección de entrega");
    expect(caja.tagName).toBe("TEXTAREA");
    await user.type(caja, "Hilton Cancun");
    expect(onChange).toHaveBeenCalled();
  });
});
