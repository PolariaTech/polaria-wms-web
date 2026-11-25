import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransporteEntregaPasoProductos } from "./TransporteEntregaPasoProductos";

const LINEAS = [
  {
    id_linea_orden_venta: "l-1",
    cantidad_pedida: 5,
    producto: { sku: "S1", descripcion: "Pollo" },
  },
] as never;

describe("TransporteEntregaPasoProductos", () => {
  it("muestra líneas y propaga verificación y cantidad", async () => {
    const onToggleLinea = vi.fn();
    const onChangeCantidad = vi.fn();
    render(
      <TransporteEntregaPasoProductos
        lineas={LINEAS}
        lineaVerificada={{ 0: false }}
        cantidades={{ 0: "5" }}
        onToggleLinea={onToggleLinea}
        onChangeCantidad={onChangeCantidad}
      />,
    );

    expect(screen.getByText("S1 Pollo")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox"));
    expect(onToggleLinea).toHaveBeenCalledWith(0, true);

    await userEvent.type(screen.getByRole("spinbutton"), "1");
    expect(onChangeCantidad).toHaveBeenCalledWith(0, "51");
  });
});
