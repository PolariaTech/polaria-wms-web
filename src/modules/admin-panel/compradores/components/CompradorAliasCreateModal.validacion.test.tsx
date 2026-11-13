import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MENSAJE_CUENTA_NO_ENCONTRADA,
  mensajeFraseLarga,
} from "../utils/comprador-alias-reglas";
import { CompradorAliasCreateModal } from "./CompradorAliasCreateModal";

const {
  empresa,
  listCatalogoProductosAdmin,
  listPreciosProductoVigentesAdmin,
  listCompradorProductoAliasAdmin,
  createCompradorProductoAliasAdmin,
} = vi.hoisted(() => ({
  empresa: { codigoCuenta: "FOODS1" },
  listCatalogoProductosAdmin: vi.fn(),
  listPreciosProductoVigentesAdmin: vi.fn(),
  listCompradorProductoAliasAdmin: vi.fn(),
  createCompradorProductoAliasAdmin: vi.fn(),
}));

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({ codigoCuenta: empresa.codigoCuenta }),
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

function producto(n: number) {
  return {
    idProducto: `p-${n}`,
    codigo: `COD${n}`,
    titulo: `Producto ${n}`,
    unidad: "kg",
  };
}

function enviarFormulario() {
  const form = document.querySelector("form");
  if (!form) throw new Error("El modal no tiene formulario.");
  fireEvent.submit(form);
}

function renderModal(comprador: typeof COMPRADOR | null = COMPRADOR) {
  return render(
    <CompradorAliasCreateModal
      open
      comprador={comprador}
      onClose={vi.fn()}
      onCreated={vi.fn()}
    />,
  );
}

describe("CompradorAliasCreateModal validación", () => {
  beforeEach(() => {
    empresa.codigoCuenta = "FOODS1";
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

  it("sin cambios, enviar el formulario dice que no hay cambios", async () => {
    renderModal();
    await screen.findByLabelText("Equivalencia DICOK");
    enviarFormulario();
    expect(
      await screen.findByText("No hay cambios para guardar."),
    ).toBeInTheDocument();
    expect(createCompradorProductoAliasAdmin).not.toHaveBeenCalled();
  });

  it("sin cuenta activa no carga productos y avisa al enviar", async () => {
    empresa.codigoCuenta = "";
    renderModal();
    await screen.findByDisplayValue("WAL01 — Walmart");
    expect(listCatalogoProductosAdmin).not.toHaveBeenCalled();
    enviarFormulario();
    expect(
      await screen.findByText(MENSAJE_CUENTA_NO_ENCONTRADA),
    ).toBeInTheDocument();
    expect(createCompradorProductoAliasAdmin).not.toHaveBeenCalled();
  });

  it("sin comprador no abre el formulario ni consulta nada", () => {
    renderModal(null);
    expect(screen.queryByLabelText("Comprador")).not.toBeInTheDocument();
    expect(listCompradorProductoAliasAdmin).not.toHaveBeenCalled();
    expect(createCompradorProductoAliasAdmin).not.toHaveBeenCalled();
  });

  it("Buscar producto sin coincidencias lo dice", async () => {
    const user = userEvent.setup({ delay: null });
    listCatalogoProductosAdmin.mockResolvedValue([1, 2, 3, 4, 5].map(producto));
    listPreciosProductoVigentesAdmin.mockResolvedValue({});
    renderModal();
    const buscar = await screen.findByLabelText("Buscar producto");
    await user.type(buscar, "zzz inexistente");
    expect(
      await screen.findByText("No hay productos que coincidan con la búsqueda."),
    ).toBeInTheDocument();
  });

  it("con el catálogo vacío lo dice", async () => {
    listCatalogoProductosAdmin.mockResolvedValue([]);
    listPreciosProductoVigentesAdmin.mockResolvedValue({});
    renderModal();
    expect(
      await screen.findByText("No hay productos en el catálogo."),
    ).toBeInTheDocument();
  });

  it("si falla la carga del catálogo lo dice", async () => {
    listCatalogoProductosAdmin.mockRejectedValue(new Error("red"));
    renderModal();
    expect(
      await screen.findByText("No se pudieron cargar los productos."),
    ).toBeInTheDocument();
  });

  it("precio 0 con frase se guarda como 0, no como null", async () => {
    const user = userEvent.setup({ delay: null });
    renderModal();
    await user.type(await screen.findByLabelText("Equivalencia DICOK"), "Pechuga");
    const precio = screen.getByLabelText("Precio DICOK");
    await user.clear(precio);
    await user.type(precio, "0");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => {
      expect(createCompradorProductoAliasAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ alias: "Pechuga", precio: 0 }),
      );
    });
  });
});
