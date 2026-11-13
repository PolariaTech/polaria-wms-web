import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mensajeFraseLarga } from "../utils/comprador-alias-reglas";
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

function renderModal() {
  return render(
    <CompradorAliasCreateModal
      open
      comprador={COMPRADOR}
      onClose={vi.fn()}
      onCreated={vi.fn()}
    />,
  );
}

describe("CompradorAliasCreateModal validación", () => {
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

  it("acepta 255 caracteres y rechaza 256 sin llamar al servicio", async () => {
    const user = userEvent.setup({ delay: null });
    renderModal();
    const frase = await screen.findByLabelText("Equivalencia DICOK");

    fireEvent.change(frase, { target: { value: "a".repeat(255) } });
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => {
      expect(createCompradorProductoAliasAdmin).toHaveBeenCalled();
    });

    createCompradorProductoAliasAdmin.mockClear();
    fireEvent.change(frase, { target: { value: "a".repeat(256) } });
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(
      await screen.findByText(mensajeFraseLarga("DICOK")),
    ).toBeInTheDocument();
    expect(createCompradorProductoAliasAdmin).not.toHaveBeenCalled();
  });

  it("al escribir -1 en Precio deja 1", async () => {
    const user = userEvent.setup({ delay: null });
    renderModal();
    const precio = await screen.findByLabelText("Precio DICOK");
    await user.clear(precio);
    await user.type(precio, "-1");
    expect(precio).toHaveValue("1");
  });

  it("Guardar está deshabilitado sin cambios y se habilita al escribir una frase", async () => {
    const user = userEvent.setup({ delay: null });
    renderModal();
    await screen.findByDisplayValue("WAL01 — Walmart");

    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    await user.type(await screen.findByLabelText("Equivalencia DICOK"), "Pechuga");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });
});
