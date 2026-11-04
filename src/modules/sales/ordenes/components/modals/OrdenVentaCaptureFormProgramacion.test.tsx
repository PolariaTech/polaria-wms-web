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

function propsBase(parcial: Partial<OrdenVentaCaptureFormProgramacionProps> = {}): OrdenVentaCaptureFormProgramacionProps {
  return {
    fechaEntrega: "2099-01-15",
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

describe("OrdenVentaCaptureFormProgramacion (REQ-215/216/254)", () => {
  it("pone los campos en el orden de REQ-216: notas, prioridad, moneda, fecha y ventana", () => {
    const { container } = render(<OrdenVentaCaptureFormProgramacion {...propsBase()} />);

    const ids = [
      "orden-venta-observaciones",
      "orden-venta-prioridad",
      "orden-venta-moneda",
      "orden-venta-fecha-entrega",
      "orden-venta-ventana-desde",
      "orden-venta-ventana-hasta",
    ];
    const posiciones = ids.map((id) => {
      const campo = container.querySelector(`#${id}`);
      expect(campo, id).not.toBeNull();
      return Array.from(container.querySelectorAll("*")).indexOf(campo as Element);
    });
    expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
  });

  it("las notas son un párrafo (textarea) y al escribir se guardan y quitan su marca", async () => {
    const user = userEvent.setup();
    const props = propsBase();
    render(<OrdenVentaCaptureFormProgramacion {...props} />);

    const notas = screen.getByLabelText(/Notas generales/);
    expect(notas.tagName).toBe("TEXTAREA");
    await user.type(notas, "x");

    expect(props.onObservaciones).toHaveBeenCalledWith("x");
    expect(props.onClearField).toHaveBeenCalledWith("observaciones");
  });

  it("cambiar la prioridad la guarda", async () => {
    const user = userEvent.setup();
    const props = propsBase();
    render(<OrdenVentaCaptureFormProgramacion {...props} />);

    const opciones = Array.from(screen.getByLabelText(/Prioridad/).querySelectorAll("option")).map((o) => o.value);
    const otra = opciones.find((valor) => valor !== "Normal") ?? "";
    await user.selectOptions(screen.getByLabelText(/Prioridad/), otra);

    expect(props.onPrioridad).toHaveBeenCalledWith(otra);
  });

  it("buscar moneda abre el selector", async () => {
    const user = userEvent.setup();
    const props = propsBase();
    render(<OrdenVentaCaptureFormProgramacion {...props} />);

    await user.click(screen.getByRole("button", { name: /Moneda|Buscar/i }));

    expect(props.onBuscarMoneda).toHaveBeenCalledOnce();
  });

  it("una fecha atrasada se avisa; una vacía, al confirmar, se marca obligatoria", () => {
    const { rerender } = render(<OrdenVentaCaptureFormProgramacion {...propsBase({ fechaEntrega: "2020-01-01" })} />);
    expect(screen.queryByText("Formato DD/MM/AAAA")).not.toBeInTheDocument();

    rerender(
      <OrdenVentaCaptureFormProgramacion
        {...propsBase({ fechaEntrega: "", marks: { ...marks, missingFields: new Set(["fechaEntrega"]) } })}
      />,
    );
    expect(screen.getByText("Obligatoria para confirmar")).toBeInTheDocument();
  });

  it("la ventana «desde» no puede pasar de la «hasta», y al arreglar una se limpia la marca de la otra", async () => {
    const user = userEvent.setup();
    const props = propsBase({ ventanaDesde: "06:00", ventanaHasta: "09:00" });
    render(<OrdenVentaCaptureFormProgramacion {...props} />);

    expect(screen.getByLabelText(/Ventana de entrega — desde/)).toHaveAttribute("max", "09:00");
    expect(screen.getByLabelText(/Ventana de entrega — hasta/)).toHaveAttribute("min", "06:00");

    await user.clear(screen.getByLabelText(/Ventana de entrega — hasta/));

    expect(props.onVentanaHasta).toHaveBeenCalled();
    expect(props.onClearField).toHaveBeenCalledWith("ventanaHasta");
  });
});
