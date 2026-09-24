import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompradoresListView } from "./CompradoresListView";

const {
  listCompradoresAdmin,
  listCompradorPreciosTemplateAdmin,
  importCompradorPreciosFromFile,
  downloadCompradorPreciosExcelTemplate,
  downloadCompradorPreciosPdf,
} = vi.hoisted(() => ({
  listCompradoresAdmin: vi.fn(),
  listCompradorPreciosTemplateAdmin: vi.fn(),
  importCompradorPreciosFromFile: vi.fn(),
  downloadCompradorPreciosExcelTemplate: vi.fn(),
  downloadCompradorPreciosPdf: vi.fn(),
}));

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({ codigoCuenta: "FOODS1" }),
}));

vi.mock("@/lib/supabase/cuenta-schema", () => ({
  withCuentaSchema: (_codigoCuenta: string, fn: () => Promise<unknown>) => fn(),
}));

vi.mock("../services/compradores.service", () => ({
  listCompradoresAdmin: (...args: unknown[]) => listCompradoresAdmin(...args),
  activateCompradorAdmin: vi.fn(),
  deactivateCompradorAdmin: vi.fn(),
}));

vi.mock("../services/comprador-producto-alias.service", () => ({
  listCompradorPreciosTemplateAdmin: (...args: unknown[]) =>
    listCompradorPreciosTemplateAdmin(...args),
  importCompradorPreciosFromFile: (...args: unknown[]) =>
    importCompradorPreciosFromFile(...args),
}));

vi.mock("../utils/comprador-precios-excel", () => ({
  downloadCompradorPreciosExcelTemplate: (...args: unknown[]) =>
    downloadCompradorPreciosExcelTemplate(...args),
}));

vi.mock("../utils/comprador-precios-pdf", () => ({
  downloadCompradorPreciosPdf: (...args: unknown[]) =>
    downloadCompradorPreciosPdf(...args),
}));

vi.mock("./CompradorCreateModal", () => ({
  CompradorCreateModal: () => null,
}));

vi.mock("./CompradorDetalleModal", () => ({
  CompradorDetalleModal: () => null,
}));

vi.mock("./CompradorEditModal", () => ({
  CompradorEditModal: () => null,
}));

describe("CompradoresListView", () => {
  beforeEach(() => {
    listCompradoresAdmin.mockReset();
    listCompradorPreciosTemplateAdmin.mockReset();
    importCompradorPreciosFromFile.mockReset();
    downloadCompradorPreciosExcelTemplate.mockReset();
    downloadCompradorPreciosPdf.mockReset();
    listCompradoresAdmin.mockResolvedValue([
      {
        idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        codigo: "WAL01",
        comprador: "Walmart",
        telefono: null,
        estaActivo: true,
      },
    ]);
    listCompradorPreciosTemplateAdmin.mockResolvedValue([
      {
        codigoComprador: "WAL01",
        nombreComprador: "Walmart",
        codigoProducto: "DICOK",
        nombreProducto: "Pollo entero",
        equivalencia: "Pollo asado",
        precioActual: 110,
      },
    ]);
  });

  it("abre el modal de gestión de precios con Exportar, Importar e Imprimir", async () => {
    const user = userEvent.setup();
    render(<CompradoresListView />);

    expect(
      await screen.findByRole("button", { name: "+ Comprador" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Gestión de precios" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Gestión de precios" }));

    expect(
      screen.getByRole("heading", { name: "Gestión de precios" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Importar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeEnabled();
  });

  it("genera el PDF de lista de precios para todos los compradores", async () => {
    const user = userEvent.setup();
    downloadCompradorPreciosPdf.mockResolvedValue(undefined);
    render(<CompradoresListView />);

    await screen.findByRole("button", { name: "+ Comprador" });
    await user.click(screen.getByRole("button", { name: "Gestión de precios" }));
    await user.click(screen.getByRole("button", { name: "Imprimir" }));
    await user.click(screen.getByRole("button", { name: "Generar PDF" }));

    await waitFor(() => {
      expect(downloadCompradorPreciosPdf).toHaveBeenCalledWith({
        rows: [
          {
            codigoComprador: "WAL01",
            nombreComprador: "Walmart",
            codigoProducto: "DICOK",
            nombreProducto: "Pollo entero",
            equivalencia: "Pollo asado",
            precioActual: 110,
          },
        ],
        scope: { mode: "todos" },
      });
    });
  });

  it("exporta la plantilla de precios al hacer clic en Exportar", async () => {
    const user = userEvent.setup();
    render(<CompradoresListView />);

    await screen.findByRole("button", { name: "+ Comprador" });
    await user.click(screen.getByRole("button", { name: "Gestión de precios" }));
    await user.click(screen.getByRole("button", { name: "Exportar" }));

    await waitFor(() => {
      expect(listCompradorPreciosTemplateAdmin).toHaveBeenCalledWith({
        codigoCuenta: "FOODS1",
      });
    });
    expect(downloadCompradorPreciosExcelTemplate).toHaveBeenCalledWith([
      {
        codigoComprador: "WAL01",
        nombreComprador: "Walmart",
        codigoProducto: "DICOK",
        nombreProducto: "Pollo entero",
        equivalencia: "Pollo asado",
        precioActual: 110,
      },
    ]);
  });

  it("importa equivalencia y precio nuevo desde el excel", async () => {
    const user = userEvent.setup();
    const file = new File(["demo"], "gestion-precios-compradores.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    importCompradorPreciosFromFile.mockResolvedValue({
      imported: 2,
      skipped: 1,
      errors: [],
    });

    render(<CompradoresListView />);
    await screen.findByRole("button", { name: "+ Comprador" });
    await user.click(screen.getByRole("button", { name: "Gestión de precios" }));

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    await user.upload(input as HTMLInputElement, file);

    await waitFor(() => {
      expect(importCompradorPreciosFromFile).toHaveBeenCalledWith(
        "FOODS1",
        file,
      );
    });
    expect(
      await screen.findByText("Se importaron 2 fila(s)."),
    ).toBeInTheDocument();
  });

  it("oculta gestión de precios en modo inspect", async () => {
    render(
      <CompradoresListView codigoCuenta="FOODS1" mode="inspect" />,
    );

    await waitFor(() => {
      expect(listCompradoresAdmin).toHaveBeenCalled();
    });

    expect(
      screen.queryByRole("button", { name: "+ Comprador" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Gestión de precios" }),
    ).not.toBeInTheDocument();
  });
});
