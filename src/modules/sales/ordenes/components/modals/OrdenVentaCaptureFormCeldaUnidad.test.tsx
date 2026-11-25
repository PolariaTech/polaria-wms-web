import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import { CeldaUnidad } from "./OrdenVentaCaptureFormCeldaUnidad";

const linea = (parcial: Partial<LineaVentaForm> = {}): LineaVentaForm => ({
  idProducto: "p1",
  nombre: "Platano",
  codigo: "PL",
  idBodega: "b1",
  cantidadInput: "4",
  cajasInput: "",
  presentacion: "",
  especificacion: "",
  ivaPct: "0",
  kgDisponible: 10,
  unidadMedida: "KGM",
  precioUnitario: 10,
  precioInput: "10",
  ...parcial,
});

describe("CeldaUnidad (REQ-380)", () => {
  it("sin onChange queda deshabilitada", () => {
    render(<CeldaUnidad linea={linea()} index={0} />);
    expect(screen.getByLabelText("Unidad de Platano")).toBeDisabled();
  });

  it("con onChange permite cambiar la unidad", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CeldaUnidad linea={linea()} index={0} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText("Unidad de Platano"), "PZA");
    expect(onChange).toHaveBeenCalledWith(0, "PZA");
  });

  it("muestra KGM (no kg) y opciones en mayúsculas", () => {
    render(
      <CeldaUnidad
        linea={linea({ unidadMedida: "kg" })}
        index={0}
        onChange={vi.fn()}
      />,
    );
    const select = screen.getByLabelText("Unidad de Platano");
    expect(select).toHaveValue("KGM");
    expect(screen.queryByRole("option", { name: "kg" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "KGM" })).toBeInTheDocument();
  });
});
