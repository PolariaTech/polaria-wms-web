import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";

const { mockReplace, mockPathname } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPathname: vi.fn(() => "/operacion"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname(),
}));

const mockCompany = {
  idBodegas: [] as string[],
  activeBodegaId: null as string | null,
};

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => mockCompany,
  TenantBodegaSelector: () => (
    <select aria-label="Seleccionar bodega activa">
      <option value="BOD-01">BOD-01</option>
    </select>
  ),
}));

import { BodegaRequiredGuard } from "./BodegaRequiredGuard";

describe("BodegaRequiredGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/operacion");
    mockCompany.idBodegas = [];
    mockCompany.activeBodegaId = null;
  });

  it("renderiza hijos cuando no hay bodegas requeridas", () => {
    render(
      <BodegaRequiredGuard>
        <span>contenido</span>
      </BodegaRequiredGuard>,
    );

    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("redirige al dashboard si hay bodegas pero ninguna activa", async () => {
    mockCompany.idBodegas = ["BOD-01", "BOD-02"];
    mockCompany.activeBodegaId = null;

    render(
      <BodegaRequiredGuard>
        <span>contenido</span>
      </BodegaRequiredGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.dashboard);
    });
  });

  it("muestra selector en dashboard cuando falta bodega activa", () => {
    mockPathname.mockReturnValue(ROUTES.dashboard);
    mockCompany.idBodegas = ["BOD-01", "BOD-02"];
    mockCompany.activeBodegaId = null;

    render(
      <BodegaRequiredGuard>
        <span>contenido</span>
      </BodegaRequiredGuard>,
    );

    expect(
      screen.getByLabelText("Seleccionar bodega activa"),
    ).toBeInTheDocument();
    expect(screen.queryByText("contenido")).not.toBeInTheDocument();
  });
});
