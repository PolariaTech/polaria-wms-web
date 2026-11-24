import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompradorPreciosStepImprimir } from "./comprador-precios-gestion-modal.step-imprimir";

function renderStep(
  overrides: Partial<Parameters<typeof CompradorPreciosStepImprimir>[0]> = {},
) {
  const props = {
    isBusy: false,
    isPrinting: false,
    printDisabled: false,
    catalogoGrupos: ["Grupo A"],
    printGrupos: [] as string[],
    printCodigosComprador: [] as string[],
    printCompradoresSeleccionados: [],
    printCompradorFieldValue: "",
    onGruposChange: vi.fn(),
    onRemoveComprador: vi.fn(),
    onOpenCompradorPicker: vi.fn(),
    onBack: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  render(<CompradorPreciosStepImprimir {...props} />);
  return props;
}

describe("CompradorPreciosStepImprimir", () => {
  it("deshabilita la descarga sin grupos ni compradores", () => {
    renderStep();
    expect(screen.getByRole("button", { name: "Descargar Excel" })).toBeDisabled();
  });

  it("permite quitar compradores seleccionados y confirmar", async () => {
    const user = userEvent.setup();
    const props = renderStep({
      printCodigosComprador: ["WAL01"],
      printCompradoresSeleccionados: [
        { codigo: "WAL01", nombre: "Walmart", grupo: "Grupo A" },
      ],
      printCompradorFieldValue: "WAL01 — Walmart",
    });

    await user.click(screen.getByTitle("Quitar"));
    expect(props.onRemoveComprador).toHaveBeenCalledWith("WAL01");

    await user.click(screen.getByRole("button", { name: "Descargar Excel" }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });
});
