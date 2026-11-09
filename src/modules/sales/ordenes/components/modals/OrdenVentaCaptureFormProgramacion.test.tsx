import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    fechaEntrega: "2099-01-15",
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

describe("OrdenVentaCaptureFormProgramacion (REQ-278)", () => {
  it("muestra fecha, día y horas; sin notas, prioridad ni moneda", () => {
    render(<OrdenVentaCaptureFormProgramacion {...propsBase()} />);

    expect(screen.getByLabelText(/Fecha de entrega/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Día de la semana/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Hora desde$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Hora hasta$/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Notas generales/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Prioridad/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Moneda$/)).not.toBeInTheDocument();
  });

  it("una fecha atrasada se avisa; una vacía, al confirmar, se marca obligatoria", () => {
    const { rerender } = render(
      <OrdenVentaCaptureFormProgramacion {...propsBase({ fechaEntrega: "2020-01-01" })} />,
    );
    expect(screen.queryByText("Formato DD/MM/AAAA")).not.toBeInTheDocument();

    rerender(
      <OrdenVentaCaptureFormProgramacion
        {...propsBase({
          fechaEntrega: "",
          marks: { ...marks, missingFields: new Set(["fechaEntrega"]) },
        })}
      />,
    );
    expect(screen.getByText("Obligatoria para confirmar")).toBeInTheDocument();
  });

  it("la hora «desde» no puede pasar de la «hasta»", async () => {
    const user = userEvent.setup();
    const props = propsBase({ ventanaDesde: "06:00", ventanaHasta: "09:00" });
    render(<OrdenVentaCaptureFormProgramacion {...props} />);

    expect(screen.getByLabelText(/^Hora desde$/)).toHaveAttribute("max", "09:00");
    expect(screen.getByLabelText(/^Hora hasta$/)).toHaveAttribute("min", "06:00");

    await user.clear(screen.getByLabelText(/^Hora hasta$/));

    expect(props.onVentanaHasta).toHaveBeenCalled();
    expect(props.onClearField).toHaveBeenCalledWith("ventanaHasta");
  });
});
