import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompradorPreciosStepExportar } from "./comprador-precios-gestion-modal.step-exportar";

const productos = [
  { idProducto: "p-1", codigo: "DICOK", nombre: "Pollo entero" },
  { idProducto: "p-2", codigo: "PEC01", nombre: "Pechuga" },
];

function renderStep(overrides: Partial<Parameters<typeof CompradorPreciosStepExportar>[0]> = {}) {
  const props = {
    isBusy: false,
    isExporting: false,
    exportDisabled: false,
    catalogoGrupos: ["Grupo A"],
    productos,
    productoIds: productos.map((row) => row.idProducto),
    selectedGrupos: ["Grupo A"],
    selectedProductos: ["p-1"],
    fechaInicio: "2026-01-01",
    fechaFin: "2026-01-31",
    fechaRangoInvalido: false,
    onGruposChange: vi.fn(),
    onProductosChange: vi.fn(),
    onFechaInicioChange: vi.fn(),
    onFechaFinChange: vi.fn(),
    onBack: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  render(<CompradorPreciosStepExportar {...props} />);
  return props;
}

describe("CompradorPreciosStepExportar", () => {
  it("confirma la exportación cuando hay selección válida", async () => {
    const user = userEvent.setup();
    const props = renderStep();

    await user.click(screen.getByRole("button", { name: "Descargar Excel" }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Volver" }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("deshabilita la descarga sin grupos o con rango inválido", () => {
    renderStep({ selectedGrupos: [] });
    expect(screen.getByRole("button", { name: "Descargar Excel" })).toBeDisabled();
  });

  it("avisa cuando el rango de fechas es inválido", () => {
    renderStep({ fechaRangoInvalido: true });
    expect(
      screen.getByText(/La fecha inicio no puede ser posterior/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar Excel" })).toBeDisabled();
  });

  it("selecciona todos los productos", async () => {
    const user = userEvent.setup();
    const props = renderStep();

    const buttons = screen.getAllByRole("button", { name: "Seleccionar todos" });
    await user.click(buttons[buttons.length - 1]);

    expect(props.onProductosChange).toHaveBeenCalledTimes(1);
    const updater = props.onProductosChange.mock.calls[0][0] as (
      prev: string[],
    ) => string[];
    expect(updater(["p-1"])).toEqual(["p-1", "p-2"]);
  });
});
