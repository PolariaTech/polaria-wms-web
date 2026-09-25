import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompradoresListView } from "./CompradoresListView";

const {
  listCompradoresAdmin,
  listCatalogoProductosAdmin,
  listGruposPertenecientesAdmin,
  listCompradorPreciosTemplateAdmin,
  importCompradorPreciosFromFile,
  downloadCompradorPreciosExcelTemplate,
  parseCompradorPreciosExcelFile,
} = vi.hoisted(() => ({
  listCompradoresAdmin: vi.fn(),
  listCatalogoProductosAdmin: vi.fn(),
  listGruposPertenecientesAdmin: vi.fn(),
  listCompradorPreciosTemplateAdmin: vi.fn(),
  importCompradorPreciosFromFile: vi.fn(),
  downloadCompradorPreciosExcelTemplate: vi.fn(),
  parseCompradorPreciosExcelFile: vi.fn(),
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

vi.mock("../services/producto-mas-vendido.service", () => ({
  listProductosMasVendidosAdmin: (...args: unknown[]) =>
    listCatalogoProductosAdmin(...args),
}));

vi.mock("../services/grupo-perteneciente.service", () => ({
  listGruposPertenecientesAdmin: (...args: unknown[]) =>
    listGruposPertenecientesAdmin(...args),
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
    listCatalogoProductosAdmin.mockReset();
    listGruposPertenecientesAdmin.mockReset();
    listCompradorPreciosTemplateAdmin.mockReset();
    importCompradorPreciosFromFile.mockReset();
    downloadCompradorPreciosExcelTemplate.mockReset();
    parseCompradorPreciosExcelFile.mockReset();
    listCompradoresAdmin.mockResolvedValue([
      {
        idComprador: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        codigo: "WAL01",
        comprador: "Walmart",
        telefono: null,
        grupo: "Grupo A",
        estaActivo: true,
      },
    ]);
    listCatalogoProductosAdmin.mockResolvedValue([
      {
        idProducto: "p-1",
        codigo: "DICOK",
        nombre: "Pollo entero",
        ranking: 1,
        unidadesVendidas: 100,
      },
    ]);
    listGruposPertenecientesAdmin.mockResolvedValue([
      "Grupo A",
      "Grupo B",
      "Grupo C",
    ]);
    listCompradorPreciosTemplateAdmin.mockResolvedValue([
      {
        grupo: "Grupo A",
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
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Gestión de precios" }));

    expect(
      screen.getByRole("heading", { name: "Gestión de precios" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Importar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeEnabled();
  });

  it("genera Excel de lista de precios filtrado por grupos", async () => {
    const user = userEvent.setup();
    downloadCompradorPreciosExcelTemplate.mockResolvedValue(undefined);
    render(<CompradoresListView />);

    await screen.findByRole("button", { name: "+ Comprador" });
    await user.click(screen.getByRole("button", { name: "Gestión de precios" }));
    await user.click(screen.getByRole("button", { name: "Imprimir" }));
    await user.click(screen.getByRole("button", { name: "Seleccionar todos" }));
    await user.click(screen.getByRole("button", { name: "Descargar Excel" }));

    await waitFor(() => {
      expect(listCompradorPreciosTemplateAdmin).toHaveBeenCalledWith({
        codigoCuenta: "FOODS1",
        filters: {
          grupos: ["Grupo A", "Grupo B", "Grupo C"],
          codigosComprador: [],
        },
      });
    });
    expect(downloadCompradorPreciosExcelTemplate).toHaveBeenCalledWith(
      [
        {
          grupo: "Grupo A",
          codigoComprador: "WAL01",
          nombreComprador: "Walmart",
          codigoProducto: "DICOK",
          nombreProducto: "Pollo entero",
          equivalencia: "Pollo asado",
          precioActual: 110,
        },
      ],
      { variant: "print" },
    );
  });

  it("exporta la plantilla de precios con filtros de fecha, grupo y producto", async () => {
    const user = userEvent.setup();
    render(<CompradoresListView />);

    await screen.findByRole("button", { name: "+ Comprador" });
    await user.click(screen.getByRole("button", { name: "Gestión de precios" }));
    await user.click(screen.getByRole("button", { name: "Exportar" }));

    const fechaInicio = (
      screen.getByLabelText("Fecha inicio") as HTMLInputElement
    ).value;
    const fechaFin = (
      screen.getByLabelText("Fecha final") as HTMLInputElement
    ).value;

    await user.click(screen.getByRole("button", { name: "Seleccionar todos" }));
    await user.click(screen.getByRole("button", { name: "Descargar Excel" }));

    await waitFor(() => {
      expect(listCompradorPreciosTemplateAdmin).toHaveBeenCalledWith({
        codigoCuenta: "FOODS1",
        filters: {
          grupos: ["Grupo A", "Grupo B", "Grupo C"],
          idProductos: ["p-1"],
          fechaInicio,
          fechaFin,
        },
      });
    });
    expect(downloadCompradorPreciosExcelTemplate).toHaveBeenCalledWith(
      [
        {
          grupo: "Grupo A",
          codigoComprador: "WAL01",
          nombreComprador: "Walmart",
          codigoProducto: "DICOK",
          nombreProducto: "Pollo entero",
          equivalencia: "Pollo asado",
          precioActual: 110,
        },
      ],
      { fechaInicio, fechaFin },
    );
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

    render(<CompradoresListView />);
    await screen.findByRole("button", { name: "+ Comprador" });
    await user.click(screen.getByRole("button", { name: "Gestión de precios" }));

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    await user.upload(input as HTMLInputElement, file);

    await screen.findByRole("button", { name: "Confirmar importación" });
    await user.click(
      screen.getByRole("button", { name: "Confirmar importación" }),
    );

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
    render(<CompradoresListView codigoCuenta="FOODS1" mode="inspect" />);

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
