import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  OrdenVentaCaptureFormProgramacion,
  type OrdenVentaCaptureFormProgramacionProps,
} from "./OrdenVentaCaptureFormProgramacion";

const marks = {
  autoFields: new Set<string>(),
  warnFields: new Set<string>(),
  missingFields: new Set<string>(),
};

function propsBase(
  parcial: Partial<OrdenVentaCaptureFormProgramacionProps> = {},
): OrdenVentaCaptureFormProgramacionProps {
  return {
    fechaEntrega: "2026-11-07",
    onFechaEntrega: vi.fn(),
    onClearFechaError: vi.fn(),
    esPorConfirmar: true,
    ventanaDesde: "",
    onVentanaDesde: vi.fn(),
    ventanaHasta: "",
    onVentanaHasta: vi.fn(),
    prioridad: "Normal",
    onPrioridad: vi.fn(),
    moneda: "MXN",
    onBuscarMoneda: vi.fn(),
    observaciones: "",
    onObservaciones: vi.fn(),
    onClearField: vi.fn(),
    marks,
    ...parcial,
  };
}

describe("OrdenVentaCaptureFormProgramacion (REQ-257)", () => {
  it("muestra el día de la semana en un campo de solo lectura al lado de la fecha", () => {
    render(<OrdenVentaCaptureFormProgramacion {...propsBase()} />);

    const dia = screen.getByLabelText(/Día de la semana/);
    expect(dia).toHaveAttribute("readonly");
    expect(dia).toHaveValue("Sábado");
  });

  it("deja el día vacío si no hay fecha de entrega", () => {
    render(
      <OrdenVentaCaptureFormProgramacion {...propsBase({ fechaEntrega: "" })} />,
    );
    expect(screen.getByLabelText(/Día de la semana/)).toHaveValue("");
  });
});
