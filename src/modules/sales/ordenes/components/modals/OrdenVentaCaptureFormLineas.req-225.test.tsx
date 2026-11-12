import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import {
  OrdenVentaCaptureFormLineas,
  type LineaConIndice,
} from "./OrdenVentaCaptureFormLineas";

function linea(): LineaVentaForm {
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
  };
}

const lineas: LineaConIndice[] = [{ linea: linea(), index: 0 }];

describe("OrdenVentaCaptureFormLineas (REQ-225)", () => {
  it("renombra Total OT → Total TAREA en el pie", () => {
    render(
      <OrdenVentaCaptureFormLineas
        lineas={lineas}
        subtotal={80}
        iva={0}
        total={80}
        totalOv={240}
        mostrarTotalOv
        otCount={3}
        puedeAgregar
        onAgregar={vi.fn()}
        onOpenReplace={vi.fn()}
        onEspecificacion={vi.fn()}
        onIva={vi.fn()}
        onCantidadChange={vi.fn()}
        onCantidadBlur={vi.fn()}
        onPrecioChange={vi.fn()}
        onPrecioBlur={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("Total TAREA")).toBeInTheDocument();
    expect(screen.getByText("Total OV (3 TAREA)")).toBeInTheDocument();
    expect(screen.queryByText("Total OT")).not.toBeInTheDocument();
  });
});
