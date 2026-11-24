import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listProveedoresAdmin: vi.fn(),
  listCatalogoProductosAdmin: vi.fn(),
  createCatalogoProductoSecundario: vi.fn(),
  listProductosPrimariosCatalogo: vi.fn(),
}));

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({ codigoCuenta: "MIT00" }),
}));
vi.mock("@/modules/admin-panel/proveedores/services/proveedores.service", () => ({
  listProveedoresAdmin: mocks.listProveedoresAdmin,
}));
vi.mock("../services/productos-catalogo.service", () => ({
  listCatalogoProductosAdmin: mocks.listCatalogoProductosAdmin,
  createCatalogoProductoSecundario: mocks.createCatalogoProductoSecundario,
  listProductosPrimariosCatalogo: mocks.listProductosPrimariosCatalogo,
}));

import { ProductoSecundarioCreateModalView } from "./ProductoSecundarioCreateModalView";

describe("ProductoSecundarioCreateModalView", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.listProveedoresAdmin.mockResolvedValue([]);
    mocks.listCatalogoProductosAdmin.mockResolvedValue([]);
    mocks.listProductosPrimariosCatalogo.mockResolvedValue([]);
  });

  it("no renderiza el formulario cerrado", () => {
    render(
      <ProductoSecundarioCreateModalView
        open={false}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />,
    );
    expect(screen.queryByText("Crear producto secundario")).not.toBeInTheDocument();
  });

  it("valida el título obligatorio al enviar vacío", async () => {
    const user = userEvent.setup();
    render(
      <ProductoSecundarioCreateModalView open onClose={vi.fn()} onCreated={vi.fn()} />,
    );
    await waitFor(() => expect(mocks.listProveedoresAdmin).toHaveBeenCalled());

    const submit = screen.getAllByRole("button", {
      name: "Crear producto secundario",
    });
    await user.click(submit[submit.length - 1]);

    expect(await screen.findByText("El título es obligatorio.")).toBeInTheDocument();
    expect(mocks.createCatalogoProductoSecundario).not.toHaveBeenCalled();
  });
});
