import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WmsRol } from "@/constants/wms/roles";

const mockFetchMetric = vi.fn();

vi.mock("@/modules/dashboard/shared/services/dashboard-data", () => ({
  fetchDashboardWidgetMetric: (...args: unknown[]) => mockFetchMetric(...args),
}));

vi.mock("@/hooks/auth/usePermissions", () => ({
  usePermissions: () => mockPermissions,
}));

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => mockCompany,
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: {
      session: {
        idUsuario: string;
        nombreRol: string;
      } | null;
    }) => unknown,
  ) =>
    selector({
      session: mockSession,
    }),
}));

const mockPermissions = {
  idRol: WmsRol.operario as string,
  nivelRol: "bodega" as const,
  hasPermission: vi.fn(),
  canAccessModule: vi.fn(),
};

const mockCompany = {
  codigoCuenta: "CUENTA-01",
  activeBodegaId: "BOD-01",
};

const mockSession = {
  idUsuario: "user-1",
  nombreRol: "Operario",
};

import { DashboardHome } from "../../home/components/DashboardHome";

describe("DashboardHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPermissions.idRol = WmsRol.operario;
    mockFetchMetric.mockResolvedValue({ ok: true, count: 2 });
  });

  it("muestra widgets de operario", async () => {
    render(<DashboardHome />);

    expect(screen.getByText("Tareas asignadas")).toBeInTheDocument();
    expect(screen.getByText("Accesos rápidos picking")).toBeInTheDocument();
    expect(screen.queryByText("OV pendientes")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetchMetric).toHaveBeenCalledWith(
        "tareas-asignadas",
        expect.objectContaining({
          idBodega: "BOD-01",
          idUsuario: "user-1",
        }),
      );
    });
  });

  it("muestra widgets de administrador de cuenta en DashboardHome", () => {
    mockPermissions.idRol = WmsRol.administrador_cuenta;

    render(<DashboardHome />);

    expect(screen.getByText("OV pendientes")).toBeInTheDocument();
    expect(screen.getByText("SOL compra")).toBeInTheDocument();
    expect(screen.queryByText("Stock resumido")).not.toBeInTheDocument();
  });

  it("muestra widgets de transportista", () => {
    mockPermissions.idRol = WmsRol.transportista;

    render(<DashboardHome />);

    expect(screen.getByText("Guías transporte")).toBeInTheDocument();
    expect(screen.queryByText("Tareas asignadas")).not.toBeInTheDocument();
  });
});
