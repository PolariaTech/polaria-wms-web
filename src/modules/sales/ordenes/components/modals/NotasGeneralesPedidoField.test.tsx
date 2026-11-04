import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotasGeneralesPedidoField } from "./NotasGeneralesPedidoField";

describe("NotasGeneralesPedidoField", () => {
  it("renderiza textarea multilínea para notas (REQ-215)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <NotasGeneralesPedidoField
        id="orden-venta-observaciones"
        value=""
        onChange={onChange}
      />,
    );
    const caja = screen.getByLabelText("Notas generales");
    expect(caja.tagName).toBe("TEXTAREA");
    await user.type(caja, "Horario 9 a 13");
    expect(onChange).toHaveBeenCalled();
  });
});
