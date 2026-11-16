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
    onClearField: vi.fn(),
    marks,
    ...parcial,
  };
}

describe("OrdenVentaCaptureFormProgramacion (REQ-257/321)", () => {
  it("muestra el día dentro del valor de fecha, sin hint de formato ni campo aparte", () => {
    render(
      <OrdenVentaCaptureFormProgramacion
        {...propsBase({ fechaEntrega: "2099-01-17" })}
      />,
    );

    expect(screen.queryByLabelText(/Día de la semana/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha de entrega/)).toHaveValue(
      "17-ENE-2099 (SÁBADO)",
    );
    expect(screen.queryByText(/Formato DD-MMM-AAAA/)).not.toBeInTheDocument();
  });

  it("sin fecha de entrega el campo queda vacío y sin hint de formato", () => {
    render(
      <OrdenVentaCaptureFormProgramacion {...propsBase({ fechaEntrega: "" })} />,
    );
    expect(screen.getByLabelText(/Fecha de entrega/)).toHaveValue("");
    expect(screen.queryByText(/Formato DD-MMM-AAAA/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Día de la semana/)).not.toBeInTheDocument();
  });
});
