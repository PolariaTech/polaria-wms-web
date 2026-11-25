import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SolicitudCompraCreateModalContent } from "./SolicitudCompraCreateModalContent";

vi.mock("@/modules/admin-panel", () => ({
  listBodegasInternasVinculadasAdmin: vi.fn(async () => []),
  listCatalogoProductosAdmin: vi.fn(async () => []),
  listProveedoresAdmin: vi.fn(async () => []),
}));
vi.mock("../../shared/services/purchases-api.service", () => ({
  createSolicitudCompraApi: vi.fn(),
}));
vi.mock("../services/solicitud-compra-n8n-client.service", () => ({
  buildSolicitudCompraN8nBody: vi.fn(),
  notifySolicitudCompraN8n: vi.fn(),
}));
vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({ codigoCuenta: "CUENTA-01", activeBodegaId: "BOD-01" }),
}));

describe("SolicitudCompraCreateModalContent", () => {
  it("muestra avisos sin proveedores/productos y valida líneas", async () => {
    render(
      <SolicitudCompraCreateModalContent
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(/debe registrar proveedores/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/debe registrar productos/)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar solicitud" }),
    );
    expect(
      await screen.findByText(/Agrega al menos una línea/),
    ).toBeInTheDocument();
  });
});
