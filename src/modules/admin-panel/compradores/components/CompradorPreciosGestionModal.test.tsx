import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompradorPreciosGestionModal } from "./CompradorPreciosGestionModal";

const GRUPOS_FIXTURE = ["Grupo A", "Grupo B", "Grupo C"] as const;

const { parseCompradorPreciosExcelFile } = vi.hoisted(() => ({
  parseCompradorPreciosExcelFile: vi.fn(),
}));

vi.mock("../utils/comprador-precios-import", async () => {
  const actual = await vi.importActual<
    typeof import("../utils/comprador-precios-import")
  >("../utils/comprador-precios-import");
  return {
    ...actual,
    parseCompradorPreciosExcelFile: (...args: unknown[]) =>
      parseCompradorPreciosExcelFile(...args),
  };
});

describe("CompradorPreciosGestionModal", () => {
  beforeEach(() => {
    parseCompradorPreciosExcelFile.mockReset();
  });

  it("muestra Exportar, Importar e Imprimir", () => {
    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={() => undefined}
        onImport={() => undefined}
        onPrint={() => undefined}
        gruposDisponibles={GRUPOS_FIXTURE}
        compradores={[
          { codigo: "WAL01", nombre: "Walmart", grupo: GRUPOS_FIXTURE[0] },
        ]}
        productos={[
          { idProducto: "p-1", codigo: "DICOK", nombre: "Pollo entero" },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Gestión de precios" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Importar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeEnabled();
  });

  it("abre filtros sin grupos seleccionados y exporta con fecha, grupo y productos", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={onExport}
        onImport={() => undefined}
        onPrint={() => undefined}
        gruposDisponibles={GRUPOS_FIXTURE}
        productos={[
          { idProducto: "p-1", codigo: "DICOK", nombre: "Pollo entero" },
          { idProducto: "p-2", codigo: "OGHK6", nombre: "Hamburguesa" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Exportar" }));
    expect(screen.getByLabelText("Fecha inicio")).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha final")).toBeInTheDocument();
    expect(screen.getByText("Grupo perteneciente")).toBeInTheDocument();
    expect(screen.getByText("Producto más vendido")).toBeInTheDocument();

    expect(
      screen.getByRole("checkbox", { name: GRUPOS_FIXTURE[0] }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: GRUPOS_FIXTURE[1] }),
    ).not.toBeChecked();

    await user.clear(screen.getByLabelText("Fecha inicio"));
    await user.type(screen.getByLabelText("Fecha inicio"), "2026-01-01");
    await user.clear(screen.getByLabelText("Fecha final"));
    await user.type(screen.getByLabelText("Fecha final"), "2026-01-31");

    await user.click(screen.getByRole("checkbox", { name: GRUPOS_FIXTURE[0] }));
    await user.click(
      screen.getByRole("checkbox", { name: /OGHK6.*Hamburguesa/ }),
    );

    await user.click(screen.getByRole("button", { name: "Descargar Excel" }));
    expect(onExport).toHaveBeenCalledWith({
      grupos: [GRUPOS_FIXTURE[0]],
      idProductos: ["p-1"],
      fechaInicio: "2026-01-01",
      fechaFin: "2026-01-31",
    });
  });

  it("muestra preview antes de confirmar la importación", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    const file = new File(["demo"], "gestion-precios-compradores.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    parseCompradorPreciosExcelFile.mockResolvedValue({
      rows: [
        {
          rowNumber: 2,
          grupo: "Grupo A",
          codigoComprador: "WAL01",
          nombreComprador: "Walmart",
          codigoProducto: "DICOK",
          nombreProducto: "Pollo entero",
          equivalencia: "Pollo asado",
          precioActual: 110,
          precioNuevo: 125,
          hasPrecioNuevo: true,
        },
      ],
      errors: [],
      skipped: 0,
    });

    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={() => undefined}
        onImport={onImport}
        onPrint={() => undefined}
        gruposDisponibles={GRUPOS_FIXTURE}
      />,
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    await user.upload(input as HTMLInputElement, file);

    await waitFor(() => {
      expect(screen.getByText(/Mostrando 1 de 1/)).toBeInTheDocument();
    });
    expect(screen.getByText("WAL01")).toBeInTheDocument();
    expect(screen.getByText("DICOK")).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Confirmar importación" }),
    );
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onImport.mock.calls[0]?.[0]).toBe(file);
  });

  it("permite imprimir por grupos y compradores adicionales", async () => {
    const user = userEvent.setup();
    const onPrint = vi.fn();

    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={() => undefined}
        onImport={() => undefined}
        onPrint={onPrint}
        gruposDisponibles={GRUPOS_FIXTURE}
        compradores={[
          { codigo: "WAL01", nombre: "Walmart", grupo: GRUPOS_FIXTURE[0] },
          { codigo: "SOR01", nombre: "Soriana", grupo: GRUPOS_FIXTURE[1] },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Imprimir" }));
    expect(
      screen.getByRole("button", { name: "Descargar Excel" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: GRUPOS_FIXTURE[0] }));
    await user.click(screen.getByRole("button", { name: "Descargar Excel" }));
    expect(onPrint).toHaveBeenCalledWith({
      grupos: [GRUPOS_FIXTURE[0]],
      codigosComprador: [],
    });

    await user.click(
      screen.getByRole("button", { name: /Buscar Compradores adicionales/i }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Seleccionar SOR01" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await user.click(screen.getByRole("button", { name: "Descargar Excel" }));
    expect(onPrint).toHaveBeenCalledWith({
      grupos: [GRUPOS_FIXTURE[0]],
      codigosComprador: ["SOR01"],
    });
  });

  it("mantiene el orden de productos recibido (más vendidos primero)", async () => {
    const user = userEvent.setup();
    render(
      <CompradorPreciosGestionModal
        open
        onClose={() => undefined}
        onExport={() => undefined}
        onImport={() => undefined}
        onPrint={() => undefined}
        gruposDisponibles={GRUPOS_FIXTURE}
        productos={[
          { idProducto: "p-top", codigo: "TOP01", nombre: "Más vendido" },
          { idProducto: "p-mid", codigo: "MID01", nombre: "Medio" },
          { idProducto: "p-low", codigo: "LOW01", nombre: "Menos vendido" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Exportar" }));
    const labels = screen
      .getAllByRole("checkbox")
      .map((node) => node.closest("label")?.textContent ?? "")
      .filter((text) => /TOP01|MID01|LOW01/.test(text));

    expect(labels[0]).toContain("TOP01");
    expect(labels[1]).toContain("MID01");
    expect(labels[2]).toContain("LOW01");
  });
});
