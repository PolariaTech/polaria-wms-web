import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompradoresListView } from "./CompradoresListView";

const {
  listCompradoresAdmin,
  listCompradorPreciosTemplateAdmin,
  downloadCompradorPreciosExcelTemplate,
} = vi.hoisted(() => ({
  listCompradoresAdmin: vi.fn(),
  listCompradorPreciosTemplateAdmin: vi.fn(),
  downloadCompradorPreciosExcelTemplate: vi.fn(),
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
}));

vi.mock("../utils/comprador-precios-excel", () => ({
  downloadCompradorPreciosExcelTemplate: (...args: unknown[]) =>
    downloadCompradorPreciosExcelTemplate(...args),
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
    downloadCompradorPreciosExcelTemplate.mockReset();
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
    expect(screen.getByRole("button", { name: "Importar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeDisabled();
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
