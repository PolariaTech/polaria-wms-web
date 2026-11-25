import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComprasPageContentImpl } from "./ComprasPageContentImpl";

const listSolicitudesCompra = vi.fn();
const listOrdenesCompra = vi.fn();

vi.mock("../../shared/services/purchases.service", () => ({
  listSolicitudesCompra: (...args: unknown[]) => listSolicitudesCompra(...args),
  listOrdenesCompra: (...args: unknown[]) => listOrdenesCompra(...args),
  listOrdenCompraLineas: vi.fn(),
}));

vi.mock("../../shared/services/purchases-api.service", () => ({
  aprobarSolicitudCompraApi: vi.fn(),
  convertirSolicitudCompraAOrdenApi: vi.fn(),
  createSolicitudCompraApi: vi.fn(),
  createOrdenCompraApi: vi.fn(),
  emitirOrdenCompraApi: vi.fn(),
  enviarSolicitudCompraAprobacionApi: vi.fn(),
  listBodegasDestinoCompraApi: vi.fn(),
  updateOrdenCompraDestinoApi: vi.fn(),
}));

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({
    codigoCuenta: "CUENTA-01",
    activeBodegaId: "BOD-01",
  }),
}));

describe("ComprasPageContentImpl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSolicitudesCompra.mockResolvedValue([]);
    listOrdenesCompra.mockResolvedValue([]);
  });

  it("carga solicitudes y permite cambiar a órdenes", async () => {
    render(<ComprasPageContentImpl />);

    await waitFor(() => {
      expect(listSolicitudesCompra).toHaveBeenCalledWith({
        codigoCuenta: "CUENTA-01",
        idBodega: "BOD-01",
      });
    });
    expect(await screen.findByText(/No hay solicitudes/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Órdenes" }));
    expect(await screen.findByText("Órdenes de compra")).toBeInTheDocument();
  });
});
