import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import { CeldaEspecificacion } from "./OrdenVentaCaptureFormEntrega-celdas";

const linea = (parcial: Partial<LineaVentaForm> = {}): LineaVentaForm => ({
  idProducto: "p1",
  nombre: "Naranja dulce",
  codigo: "10501544",
  idBodega: "b1",
  cantidadInput: "40",
  cajasInput: "",
  presentacion: "",
  especificacion: "",
  ivaPct: "0",
  kgDisponible: 10,
  unidadMedida: "KGM",
  precioUnitario: 19,
  precioInput: "19",
  ...parcial,
});

describe("CeldaEspecificacion (REQ-396)", () => {
  it("muestra la especificación completa en un párrafo de varias líneas", () => {
    const texto = "10 cm diam jugosa, piel lisa";
    render(<CeldaEspecificacion linea={linea({ especificacion: texto })} index={0} onChange={vi.fn()} />);

    const campo = screen.getByLabelText("Especificación de Naranja dulce");
    expect(campo.tagName).toBe("TEXTAREA");
    expect(campo).toHaveValue(texto);
    expect(campo.className).toContain("whitespace-pre-wrap");
    expect(campo.className).toContain("break-words");
  });

  it("avisa el texto nuevo al formulario", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CeldaEspecificacion linea={linea()} index={2} onChange={onChange} />);

    await user.type(screen.getByLabelText("Especificación de Naranja dulce"), "lisa");

    expect(onChange).toHaveBeenLastCalledWith(2, "a");
    expect(onChange).toHaveBeenCalledTimes(4);
  });
});
