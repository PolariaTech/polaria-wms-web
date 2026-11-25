import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  numeroDeOrigen,
  OrdenVentaDetalleOrigenFallback,
} from "./OrdenVentaDetalleOrigenFallback";

describe("numeroDeOrigen", () => {
  it.each([
    [12.5, 12.5],
    ["3,5", 3.5],
    ["7", 7],
    ["abc", 0],
    ["", 0],
    [undefined, 0],
    [null, 0],
  ])("%j → %j", (entrada, esperado) => {
    expect(numeroDeOrigen(entrada)).toBe(esperado);
  });
});

describe("OrdenVentaDetalleOrigenFallback", () => {
  it("avisa que los productos del correo aún no están ligados al catálogo", () => {
    render(<OrdenVentaDetalleOrigenFallback renglones={[]} />);
    expect(screen.getByText(/aún sin ligar al catálogo/)).toBeInTheDocument();
  });

  it("pinta producto, código, cantidad con unidad y precio", () => {
    render(
      <OrdenVentaDetalleOrigenFallback
        renglones={[
          {
            Producto: "PAPAYA",
            "Codigo producto": "SKU-1",
            Cantidad: "3,5",
            Unidad: "KG",
            Precio: 10,
          },
        ]}
      />,
    );
    const fila = screen.getAllByRole("row")[1]!;
    expect(within(fila).getByText("PAPAYA")).toBeInTheDocument();
    expect(within(fila).getByText("Cód. SKU-1")).toBeInTheDocument();
    expect(fila).toHaveTextContent("3,5 KG");
    expect(fila).toHaveTextContent("$10.00");
  });

  it("sin nombre, código ni precio usa los textos de respaldo", () => {
    render(<OrdenVentaDetalleOrigenFallback renglones={[{ Cantidad: 1 }]} />);
    const fila = screen.getAllByRole("row")[1]!;
    expect(within(fila).getByText("Producto")).toBeInTheDocument();
    expect(within(fila).getByText("Del correo")).toBeInTheDocument();
    expect(within(fila).getByText("—")).toBeInTheDocument();
  });
});
