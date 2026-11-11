import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DireccionEntregaField } from "./DireccionEntregaField";

vi.mock("./EntregaMapaModal", () => ({
  EntregaMapaModal: ({
    open,
    modo,
  }: {
    open: boolean;
    modo: string;
  }) =>
    open ? (
      <div role="dialog" data-modo={modo}>
        mapa-mock
      </div>
    ) : null,
}));

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

  it("abre el mapa al clic del pin (REQ-251)", async () => {
    const user = userEvent.setup();
    render(
      <DireccionEntregaField
        id="orden-venta-direccion"
        value="Av. 10"
        onChange={vi.fn()}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Abrir mapa de dirección de entrega/i }),
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-modo", "editar");
  });

  it("en solo lectura abre mapa en modo ver", async () => {
    const user = userEvent.setup();
    render(
      <DireccionEntregaField
        id="detalle-direccion"
        value="Calle 1"
        onChange={vi.fn()}
        soloLectura
        entregaLat={20.63}
        entregaLng={-87.07}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Abrir mapa de dirección de entrega/i }),
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-modo", "ver");
  });
});
