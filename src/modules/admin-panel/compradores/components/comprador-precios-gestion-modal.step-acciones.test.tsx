import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompradorPreciosStepAcciones } from "./comprador-precios-gestion-modal.step-acciones";

const baseProps = {
  isBusy: false,
  isParsingImport: false,
  isImporting: false,
  exportDisabled: false,
  importDisabled: false,
  printDisabled: false,
};

describe("CompradorPreciosStepAcciones", () => {
  it("navega a exportar e imprimir y abre el selector de archivo", async () => {
    const user = userEvent.setup();
    const onStep = vi.fn();
    const onPickFile = vi.fn();
    render(
      <CompradorPreciosStepAcciones
        {...baseProps}
        onStep={onStep}
        onPickFile={onPickFile}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Exportar" }));
    expect(onStep).toHaveBeenLastCalledWith("exportar");
    await user.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(onStep).toHaveBeenLastCalledWith("imprimir");
    await user.click(screen.getByRole("button", { name: "Importar" }));
    expect(onPickFile).toHaveBeenCalledTimes(1);
  });

  it("deshabilita acciones y muestra estado de lectura", () => {
    render(
      <CompradorPreciosStepAcciones
        {...baseProps}
        isBusy
        isParsingImport
        onStep={() => undefined}
        onPickFile={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Exportar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Leyendo…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeDisabled();
  });
});
