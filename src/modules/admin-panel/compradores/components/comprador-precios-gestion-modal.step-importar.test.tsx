import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CompradorPreciosExcelImportRow } from "../utils/comprador-precios-import";
import { CompradorPreciosStepImportar } from "./comprador-precios-gestion-modal.step-importar";

const row = {
  rowNumber: 2,
  grupo: "Grupo A",
  codigoComprador: "WAL01",
  nombreComprador: "Walmart",
  codigoProducto: "DICOK",
  nombreProducto: "Pollo entero",
  equivalencia: "",
  precioActual: 10,
  precioNuevo: 12,
  hasPrecioNuevo: true,
} as unknown as CompradorPreciosExcelImportRow;

describe("CompradorPreciosStepImportar", () => {
  it("muestra la vista previa y confirma la importación", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <CompradorPreciosStepImportar
        isBusy={false}
        isImporting={false}
        importDisabled={false}
        pendingImportFile={new File(["x"], "precios.xlsx")}
        importPreviewRows={[row]}
        importTotalRows={5}
        onBack={() => undefined}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("precios.xlsx")).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 1 de 5/)).toBeInTheDocument();
    expect(screen.getByText("WAL01")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Confirmar importación" }),
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("sin filas deshabilita confirmar y muestra aviso", () => {
    render(
      <CompradorPreciosStepImportar
        isBusy={false}
        isImporting={false}
        importDisabled={false}
        pendingImportFile={null}
        importPreviewRows={[]}
        importTotalRows={0}
        onBack={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    expect(screen.getByText("No hay archivo pendiente.")).toBeInTheDocument();
    expect(
      screen.getByText("No hay filas válidas para previsualizar."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar importación" }),
    ).toBeDisabled();
  });
});
