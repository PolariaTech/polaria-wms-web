import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { ImpresionRapidaConfirmacion } from "./ImpresionRapidaConfirmacion";

const orden = [
  {
    row: {
      idOrdenVenta: "1",
      venta: "OV-1",
      comprador: "Hotel Sol",
      fechaEntrega: "2026-11-05",
    } as OrdenVentaOperadorRow,
    ots: [1, 2],
  },
];

function montar(extra: Partial<Parameters<typeof ImpresionRapidaConfirmacion>[0]> = {}) {
  const props = {
    open: true,
    hojas: 300,
    orden,
    impresora: "Zebra bodega",
    imprimiendo: false,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    ...extra,
  };
  render(<ImpresionRapidaConfirmacion {...props} />);
  return props;
}

describe("ImpresionRapidaConfirmacion", () => {
  it("el primer paso muestra qué sale y no imprime todavía", async () => {
    const props = montar();

    expect(screen.getByText(/Se enviarán 300 hojas de 1 OV a Zebra bodega/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));

    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("el segundo paso repite el número de hojas y solo ahí se envía", async () => {
    const props = montar();
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));

    expect(screen.getByText("¿Seguro que quieres imprimir 300 hojas?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sí, imprimir 300 hojas" }));

    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("con una sola hoja habla en singular", async () => {
    montar({ hojas: 1 });
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));

    expect(screen.getByText("¿Seguro que quieres imprimir 1 hoja?")).toBeInTheDocument();
  });

  it("al volver a abrirlo empieza otra vez por el primer paso", async () => {
    const props = {
      hojas: 5,
      orden,
      impresora: null,
      imprimiendo: false,
      onClose: vi.fn(),
      onConfirm: vi.fn(),
    };
    const { rerender } = render(<ImpresionRapidaConfirmacion open {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(screen.getByText(/¿Seguro que quieres imprimir 5 hojas\?/)).toBeInTheDocument();

    rerender(<ImpresionRapidaConfirmacion open={false} {...props} />);
    rerender(<ImpresionRapidaConfirmacion open {...props} />);

    expect(await screen.findByText("¿Imprimir esta selección?")).toBeInTheDocument();
  });

  it("si va en partes lo dice: cuántas, la pausa, lo que tarda y que no se cierre la pestaña", async () => {
    montar({ partes: 4, esperaMinutos: 1 });

    expect(
      screen.getByText(/Se mandará en 4 partes, una cada minuto \(unos 3 min\)\. No cierres esta pestaña/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(screen.getByText(/Se mandará en 4 partes/)).toBeInTheDocument();
  });

  it("si la impresora encola sola dice las partes pero no una pausa", () => {
    montar({ partes: 3, esperaMinutos: 0 });

    const texto = screen.getByText(/Se mandará en 3 partes\./);
    expect(texto).not.toHaveTextContent("una cada");
  });

  it("en un solo envío no dice nada de partes", () => {
    montar({ partes: 1 });

    expect(screen.queryByText(/Se mandará en/)).not.toBeInTheDocument();
  });

  it("cancelar en cualquier paso cierra sin enviar", async () => {
    const props = montar();

    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(props.onClose).toHaveBeenCalled();
    expect(props.onConfirm).not.toHaveBeenCalled();
  });
});
