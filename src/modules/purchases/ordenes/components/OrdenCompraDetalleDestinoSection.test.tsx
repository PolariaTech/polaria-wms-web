import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrdenCompraRow } from "../../shared/types/purchases.types";
import { OrdenCompraDetalleDestinoSection } from "./OrdenCompraDetalleDestinoSection";

const ORDEN = {
  id_orden_compra: "oc-1",
  fecha_entrega_estimada: null,
} as OrdenCompraRow;

function buildProps(
  overrides: Partial<Parameters<typeof OrdenCompraDetalleDestinoSection>[0]> = {},
) {
  return {
    orden: ORDEN,
    canEditDestino: false,
    destinoTipo: "interna" as const,
    idBodega: "",
    fechaEntrega: "",
    bodegasDestino: [],
    bodegaOptions: [{ value: "b-1", label: "Bodega 1" }],
    bodegaReadLabel: "BOD-X",
    isLoadingBodegas: false,
    isSavingDestino: false,
    bodegasError: null,
    destinoError: null,
    onFechaEntregaChange: vi.fn(),
    onDestinoTipoChange: vi.fn(),
    onBodegaChange: vi.fn(),
    ...overrides,
  };
}

describe("OrdenCompraDetalleDestinoSection", () => {
  it("en modo lectura muestra la bodega y no hay selects", () => {
    render(<OrdenCompraDetalleDestinoSection {...buildProps()} />);

    expect(screen.getByText("BOD-X")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tipo")).not.toBeInTheDocument();
  });

  it("en modo edición permite cambiar tipo y bodega", async () => {
    const props = buildProps({
      canEditDestino: true,
      bodegasDestino: [{ idBodega: "b-1" } as never],
    });
    render(<OrdenCompraDetalleDestinoSection {...props} />);

    await userEvent.selectOptions(screen.getByLabelText("Tipo"), "externa");
    expect(props.onDestinoTipoChange).toHaveBeenCalledWith("externa");

    await userEvent.selectOptions(
      screen.getByLabelText("Bodega destino"),
      "b-1",
    );
    expect(props.onBodegaChange).toHaveBeenCalledWith("b-1");
  });

  it("muestra avisos de error y de falta de bodegas", () => {
    render(
      <OrdenCompraDetalleDestinoSection
        {...buildProps({
          canEditDestino: true,
          destinoTipo: "externa",
          bodegasError: "falló bodegas",
          destinoError: "falló destino",
        })}
      />,
    );

    expect(screen.getByText(/bodegas externas/)).toBeInTheDocument();
    expect(screen.getAllByRole("alert").map((n) => n.textContent)).toEqual([
      "falló bodegas",
      "falló destino",
    ]);
  });
});
