import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompradorPreciosGestionModal } from "./CompradorPreciosGestionModal";

describe("CompradorPreciosGestionModal", () => {
  it("muestra Exportar, Importar e Imprimir", () => {
    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={() => undefined}
        onImport={() => undefined}
        onPrint={() => undefined}
        compradores={[{ codigo: "WAL01", nombre: "Walmart" }]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Gestión de precios" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Importar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeEnabled();
  });

  it("ejecuta exportar al hacer clic", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={onExport}
        onImport={() => undefined}
        onPrint={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Exportar" }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("ejecuta importar al elegir un archivo", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    const file = new File(["demo"], "gestion-precios-compradores.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={() => undefined}
        onImport={onImport}
        onPrint={() => undefined}
      />,
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    await user.upload(input as HTMLInputElement, file);
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onImport.mock.calls[0]?.[0]).toBe(file);
  });

  it("permite imprimir todos o un comprador", async () => {
    const user = userEvent.setup();
    const onPrint = vi.fn();

    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={() => undefined}
        onImport={() => undefined}
        onPrint={onPrint}
        compradores={[
          { codigo: "WAL01", nombre: "Walmart" },
          { codigo: "SOR01", nombre: "Soriana" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(screen.getByLabelText("Comprador")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Generar PDF" }));
    expect(onPrint).toHaveBeenCalledWith({ mode: "todos" });

    await user.selectOptions(screen.getByLabelText("Comprador"), "WAL01");
    await user.click(screen.getByRole("button", { name: "Generar PDF" }));
    expect(onPrint).toHaveBeenCalledWith({
      mode: "one",
      codigoComprador: "WAL01",
    });
  });
});
