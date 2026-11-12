import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import {
  OrdenVentaCaptureFormLineas,
  type LineaConIndice,
} from "./OrdenVentaCaptureFormLineas";

function linea(parcial: Partial<LineaVentaForm> = {}): LineaVentaForm {
  return {
    idProducto: "p1",
    nombre: "Aguacate",
    codigo: "AGU",
    idBodega: "b1",
    cantidadInput: "2",
    cajasInput: "",
    presentacion: "",
    especificacion: "",
    ivaPct: "0",
    kgDisponible: 10,
    unidadMedida: "KG",
    precioUnitario: 40,
    precioInput: "40",
    ...parcial,
  };
}

const conIndice = (n: number): LineaConIndice[] =>
  Array.from({ length: n }, (_v, index) => ({ linea: linea({ idProducto: `p${index}`, nombre: `Producto ${index + 1}` }), index }));

function propsBase(parcial: Record<string, unknown> = {}) {
  return {
    lineas: conIndice(2),
    subtotal: 160,
    iva: 0,
    total: 160,
    totalOv: 160,
    mostrarTotalOv: false,
    otCount: 1,
    puedeAgregar: true,
    onAgregar: vi.fn(),
    onOpenReplace: vi.fn(),
    onEspecificacion: vi.fn(),
    onIva: vi.fn(),
    onCantidadChange: vi.fn(),
    onCantidadBlur: vi.fn(),
    onPrecioChange: vi.fn(),
    onPrecioBlur: vi.fn(),
    onRemove: vi.fn(),
    ...parcial,
  };
}

describe("OrdenVentaCaptureFormLineas — pie de Productos (REQ-224)", () => {
  it("muestra a la izquierda cuántos productos hay, sin unidad", () => {
    render(<OrdenVentaCaptureFormLineas {...propsBase()} />);

    expect(screen.getByText("2 productos")).toBeInTheDocument();
  });

  it("con un solo producto lo dice en singular", () => {
    render(<OrdenVentaCaptureFormLineas {...propsBase({ lineas: conIndice(1) })} />);

    expect(screen.getByText("1 producto")).toBeInTheDocument();
    expect(screen.queryByText("1 productos")).not.toBeInTheDocument();
  });

  it("sin productos el conteo es 0 y se invita a agregar uno", () => {
    render(<OrdenVentaCaptureFormLineas {...propsBase({ lineas: [], subtotal: 0, total: 0, totalOv: 0 })} />);

    expect(screen.getByText("0 productos")).toBeInTheDocument();
    expect(screen.getByText(/Sin productos\. Agrega al menos uno/)).toBeInTheDocument();
  });

  it("el conteo queda antes que los totales", () => {
    render(<OrdenVentaCaptureFormLineas {...propsBase()} />);

    const conteo = screen.getByText("2 productos");
    const subtotal = screen.getByText("Subtotal");
    expect(conteo.compareDocumentPosition(subtotal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("con varias OT el total es el de la OT y aparece también el de la OV", () => {
    render(
      <OrdenVentaCaptureFormLineas
        {...propsBase({ mostrarTotalOv: true, otCount: 3, totalOv: 480 })}
      />,
    );

    expect(screen.getByText("Total TAREA")).toBeInTheDocument();
    expect(screen.getByText("Total OV (3 TAREA)")).toBeInTheDocument();
  });

  it("agregar producto y quitar una línea avisan al formulario", async () => {
    const user = userEvent.setup();
    const props = propsBase();
    render(<OrdenVentaCaptureFormLineas {...props} />);

    await user.click(screen.getByRole("button", { name: /Agregar producto/ }));
    await user.click(screen.getByRole("button", { name: "Quitar Producto 2" }));

    expect(props.onAgregar).toHaveBeenCalledOnce();
    expect(props.onRemove).toHaveBeenCalledWith(1);
  });

  it("sin permiso para agregar el botón queda deshabilitado", () => {
    render(<OrdenVentaCaptureFormLineas {...propsBase({ puedeAgregar: false })} />);

    expect(screen.getByRole("button", { name: /Agregar producto/ })).toBeDisabled();
  });
});
