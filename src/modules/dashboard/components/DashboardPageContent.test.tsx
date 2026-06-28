import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WmsRol } from "@/constants/roles";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => mockPermissions,
}));

vi.mock("@/modules/dashboard/components/DashboardHome", () => ({
  DashboardHome: () => <div>dashboard-widgets</div>,
}));

const mockPermissions = {
  idRol: WmsRol.administrador_cuenta as string,
  nivelRol: "cuenta" as const,
  hasPermission: vi.fn(),
  canAccessModule: vi.fn(),
};

import { DashboardPageContent } from "./DashboardPageContent";

describe("DashboardPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPermissions.idRol = WmsRol.administrador_cuenta;
  });

  it("muestra Panel administrativo para administrador de cuenta", () => {
    render(<DashboardPageContent />);

    expect(
      screen.getByRole("heading", { name: "Panel administrativo" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Asignación y creación" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Catálogo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reportes" })).toBeInTheDocument();
    expect(screen.queryByText("dashboard-widgets")).not.toBeInTheDocument();
  });

  it("navega al seleccionar una acción del panel administrativo", async () => {
    const user = userEvent.setup();

    render(<DashboardPageContent />);

    await user.click(screen.getByRole("button", { name: "Catálogo" }));

    expect(mockPush).toHaveBeenCalledWith("/dashboard/administracion/catalogo");
  });

  it("muestra hub operador de cuenta sin panel admin ni widgets", () => {
    mockPermissions.idRol = WmsRol.operador_cuenta;

    render(<DashboardPageContent />);

    expect(
      screen.getByRole("heading", { name: "Operación de cuenta" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Proveedor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bodega externa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bodega interna" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ventas" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Panel administrativo" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("dashboard-widgets")).not.toBeInTheDocument();
  });

  it("navega desde hub operador de cuenta", async () => {
    const user = userEvent.setup();
    mockPermissions.idRol = WmsRol.operador_cuenta;

    render(<DashboardPageContent />);

    await user.click(screen.getByRole("button", { name: "Proveedor" }));

    expect(mockPush).toHaveBeenCalledWith("/dashboard/compras");
  });

  it("mantiene widgets operativos para otros roles", () => {
    mockPermissions.idRol = WmsRol.operario;

    render(<DashboardPageContent />);

    expect(screen.getByText("dashboard-widgets")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Panel administrativo" }),
    ).not.toBeInTheDocument();
  });
});
