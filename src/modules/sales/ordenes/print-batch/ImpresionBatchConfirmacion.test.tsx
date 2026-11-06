import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { ImpresionBatchConfirmacion } from "./ImpresionBatchConfirmacion";

const ov = (id: string, fechaEntrega: string | null) =>
  ({ idOrdenVenta: id, venta: `OV-${id}`, comprador: "Hotel Sol", fechaEntrega }) as OrdenVentaOperadorRow;

function montar(extra: Partial<Parameters<typeof ImpresionBatchConfirmacion>[0]> = {}) {
  const props = {
    open: true,
    hojas: 3,
    orden: [
      { row: ov("a", "2026-11-06"), ots: [1, 3] },
      { row: ov("b", null), ots: [1] },
    ],
    impresora: "Brother cocina",
    imprimiendo: false,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    ...extra,
  };
  render(<ImpresionBatchConfirmacion {...props} />);
  return props;
}

describe("ImpresionBatchConfirmacion", () => {
  it("nombra la impresora, las hojas y las OV numeradas en el orden del PDF", () => {
    montar();
    expect(
      screen.getByText("Se enviarán 3 hojas de 2 OV a Brother cocina, en este orden."),
    ).toBeInTheDocument();
    const filas = screen.getAllByRole("listitem");
    expect(filas[0]).toHaveTextContent("1.OV-a · Hotel Sol06/11 · OT 1, 3");
    expect(filas[1]).toHaveTextContent("2.OV-b · Hotel SolOT 1");
  });

  it("mientras no se conoce la impresora lo dice en general", () => {
    montar({ impresora: null });
    expect(screen.getByText(/a la impresora de la cuenta/)).toBeInTheDocument();
  });

  it("confirma con el botón Imprimir", async () => {
    const props = montar();
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cerrado no muestra nada", () => {
    montar({ open: false });
    expect(screen.queryByText("¿Imprimir esta selección?")).toBeNull();
  });
});
