import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompradorAliasCreateModal } from "./CompradorAliasCreateModal";

const {
  listCatalogoProductosAdmin,
  listPreciosProductoVigentesAdmin,
  listCompradorProductoAliasAdmin,
  createCompradorProductoAliasAdmin,
} = vi.hoisted(() => ({
  listCatalogoProductosAdmin: vi.fn(),
  listPreciosProductoVigentesAdmin: vi.fn(),
  listCompradorProductoAliasAdmin: vi.fn(),
  createCompradorProductoAliasAdmin: vi.fn(),
}));

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({ codigoCuenta: "FOODS1" }),
}));

vi.mock("@/modules/admin-panel/catalogo/services/productos-catalogo.service", () => ({
  listCatalogoProductosAdmin: (...args: unknown[]) =>
    listCatalogoProductosAdmin(...args),
  listPreciosProductoVigentesAdmin: (...args: unknown[]) =>
    listPreciosProductoVigentesAdmin(...args),
}));

vi.mock("../services/comprador-producto-alias.service", () => ({
  listCompradorProductoAliasAdmin: (...args: unknown[]) =>
    listCompradorProductoAliasAdmin(...args),
  createCompradorProductoAliasAdmin: (...args: unknown[]) =>
    createCompradorProductoAliasAdmin(...args),
}));

describe("CompradorAliasCreateModal", () => {
  beforeEach(() => {
    listCatalogoProductosAdmin.mockReset();
    listPreciosProductoVigentesAdmin.mockReset();
    listCompradorProductoAliasAdmin.mockReset();
    createCompradorProductoAliasAdmin.mockReset();

    listCatalogoProductosAdmin.mockResolvedValue([
      {
        idProducto: "p-1",
        codigo: "DICOK",
        titulo: "Pollo entero",
        unidad: "kg",
      },
    ]);
    listPreciosProductoVigentesAdmin.mockResolvedValue({ "p-1": 40 });
    listCompradorProductoAliasAdmin.mockResolvedValue([]);
    createCompradorProductoAliasAdmin.mockResolvedValue(undefined);
  });

  it("valida precio inválido y permite guardar solo con precio", async () => {
    const user = userEvent.setup({ delay: null });
    const onClose = vi.fn();
    const onCreated = vi.fn();

    render(
      <CompradorAliasCreateModal
        open
        comprador={{
          idComprador: "c-1",
          codigo: "WAL01",
          comprador: "Walmart",
          codigoCuenta: "FOODS1",
          nit: null,
          telefono: null,
          estaActivo: true,
          grupo: "Grupo A",
        }}
        onClose={onClose}
        onCreated={onCreated}
      />,
    );

    await screen.findByDisplayValue("WAL01 — Walmart");

    const precioInputs = await screen.findAllByRole("textbox");
    const precio = precioInputs.find((el) =>
      (el as HTMLInputElement).value.includes("40"),
    );
    expect(precio).toBeTruthy();

    await user.clear(precio!);
    await user.type(precio!, "abc");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Ingresa un precio válido para DICOK."),
    ).toBeInTheDocument();
    expect(createCompradorProductoAliasAdmin).not.toHaveBeenCalled();

    await user.clear(precio!);
    await user.type(precio!, "55");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(createCompradorProductoAliasAdmin).toHaveBeenCalled();
    });
  });
});
