import { render, screen } from "@testing-library/react";
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

const COMPRADOR = {
  idComprador: "c-1",
  codigo: "WAL01",
  comprador: "Walmart",
  codigoCuenta: "FOODS1",
  nit: null,
  telefono: null,
  estaActivo: true,
  grupo: "Grupo A",
};

describe("CompradorAliasCreateModal varias frases", () => {
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
    createCompradorProductoAliasAdmin.mockResolvedValue(undefined);
  });

  it("deja escribir otra frase en un producto que ya tiene equivalencia", async () => {
    listCompradorProductoAliasAdmin.mockResolvedValue([
      {
        idProducto: "p-1",
        alias: "Pollo asado",
        precioOverride: null,
      },
    ]);
    const user = userEvent.setup({ delay: null });

    render(
      <CompradorAliasCreateModal
        open
        comprador={COMPRADOR}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    const frase = await screen.findByLabelText("Equivalencia DICOK");
    expect(frase).not.toBeDisabled();
    await user.type(frase, "Pechuga");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(createCompradorProductoAliasAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        idProducto: "p-1",
        alias: "Pechuga",
      }),
    );
  });

  it("avisa si ya hay precio especial y se escribe otro", async () => {
    listCompradorProductoAliasAdmin.mockResolvedValue([
      {
        idProducto: "p-1",
        alias: "Pollo asado",
        precioOverride: 55,
      },
    ]);
    const user = userEvent.setup({ delay: null });

    render(
      <CompradorAliasCreateModal
        open
        comprador={COMPRADOR}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    const precio = await screen.findByLabelText("Precio DICOK");
    await user.clear(precio);
    await user.type(precio, "70");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText(
        "Este cliente ya tiene un precio especial para Pollo entero. Cámbialo en la tabla de equivalencias.",
      ),
    ).toBeInTheDocument();
    expect(createCompradorProductoAliasAdmin).not.toHaveBeenCalled();
  });
});
