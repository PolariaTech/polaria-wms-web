import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrdenVentaCaptureFormEntrega } from "./OrdenVentaCaptureFormEntrega";

function propsBase(parcial: Record<string, unknown> = {}) {
  return {
    direccion: "",
    onDireccion: vi.fn(),
    avisoVerificarDireccion: false,
    contacto: "",
    onContacto: vi.fn(),
    telefono: "",
    onTelefono: vi.fn(),
    correo: "",
    onCorreo: vi.fn(),
    onClearField: vi.fn(),
    autoFields: new Set<string>(),
    warnFields: new Set<string>(),
    missingFields: new Set<string>(),
    ...parcial,
  };
}

describe("OrdenVentaCaptureFormEntrega (REQ-217/254)", () => {
  it("la programación va dentro de «Entrega», antes de la dirección", () => {
    render(
      <OrdenVentaCaptureFormEntrega {...propsBase()}>
        <p>programación de la entrega</p>
      </OrdenVentaCaptureFormEntrega>,
    );

    const programacion = screen.getByText("programación de la entrega");
    const direccion = screen.getByLabelText(/Dirección de entrega/);
    expect(screen.getByText("Entrega")).toBeInTheDocument();
    expect(programacion.compareDocumentPosition(direccion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("contacto, teléfono y correo van antes de la dirección a ancho completo (REQ-278)", () => {
    const { container } = render(<OrdenVentaCaptureFormEntrega {...propsBase()} />);

    const direccion = screen.getByLabelText(/Dirección de entrega/);
    expect(direccion.tagName).toBe("TEXTAREA");
    expect(direccion.closest("div.sm\\:col-span-3")).not.toBeNull();

    const posicion = (id: string) =>
      Array.from(container.querySelectorAll("*")).indexOf(container.querySelector(`#${id}`) as Element);
    expect(posicion("orden-venta-contacto")).toBeLessThan(posicion("orden-venta-telefono"));
    expect(posicion("orden-venta-telefono")).toBeLessThan(posicion("orden-venta-correo"));
    expect(posicion("orden-venta-correo")).toBeLessThan(posicion("orden-venta-direccion"));
  });

  it("escribir la dirección la guarda y quita su marca", async () => {
    const user = userEvent.setup();
    const props = propsBase();
    render(<OrdenVentaCaptureFormEntrega {...props} />);

    await user.type(screen.getByLabelText(/Dirección de entrega/), "A");

    expect(props.onDireccion).toHaveBeenCalledWith("A");
    expect(props.onClearField).toHaveBeenCalledWith("direccion");
  });

  it("al cambiar de cliente avisa de revisar la dirección", () => {
    const { rerender } = render(<OrdenVentaCaptureFormEntrega {...propsBase()} />);
    expect(screen.queryByText(/Cambiaste el cliente/)).not.toBeInTheDocument();

    rerender(<OrdenVentaCaptureFormEntrega {...propsBase({ avisoVerificarDireccion: true })} />);
    expect(screen.getByText(/Cambiaste el cliente/)).toBeInTheDocument();
  });

  it.each([
    ["Contacto del cliente", "onContacto", "contacto"],
    ["Teléfono del contacto", "onTelefono", "telefono"],
    ["Correo del contacto", "onCorreo", "correo"],
  ])("escribir «%s» lo guarda y quita su marca", async (etiqueta, manejador, campo) => {
    const user = userEvent.setup();
    const props = propsBase();
    render(<OrdenVentaCaptureFormEntrega {...props} />);

    await user.type(screen.getByLabelText(etiqueta), "x");

    expect((props as Record<string, ReturnType<typeof vi.fn>>)[manejador]).toHaveBeenCalledWith("x");
    expect(props.onClearField).toHaveBeenCalledWith(campo);
  });
});
