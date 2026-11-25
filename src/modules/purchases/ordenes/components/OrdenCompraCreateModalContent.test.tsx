import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrdenCompraCreateModalContent } from "./OrdenCompraCreateModalContent";

vi.mock("@/modules/admin-panel", () => ({
  listBodegasInternasVinculadasAdmin: vi.fn(async () => []),
  listCatalogoProductosAdmin: vi.fn(async () => []),
  listProveedoresAdmin: vi.fn(async () => []),
}));
vi.mock("../../shared/services/purchases-api.service", () => ({
  createOrdenCompraApi: vi.fn(),
}));
vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({ codigoCuenta: "CUENTA-01", activeBodegaId: "BOD-01" }),
}));

describe("OrdenCompraCreateModalContent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("valida que haya proveedor al guardar", async () => {
    render(
      <OrdenCompraCreateModalContent
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Sin proveedores")).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar orden" }));

    expect(
      await screen.findByText(/Selecciona un proveedor para la orden/),
    ).toBeInTheDocument();
  });
});
