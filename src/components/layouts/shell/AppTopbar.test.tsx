import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { useOvFechaFiltroStore } from "@/stores/ov-fecha-filtro.store";
import type { AuthSession } from "@/types/auth/auth";

const nav = vi.hoisted(() => ({ pathname: "/dashboard" }));

const mockSession: AuthSession = {
  idUsuario: "usr-1",
  idAuth: "auth-1",
  nombre: "Super Configurador",
  username: "super.config",
  correo: "config@polaria.tech",
  telefono: null,
  idRol: "configurador",
  nombreRol: "Configurador TI",
  nivelRol: "platform",
  codigoEmpresa: null,
  razonSocialEmpresa: null,
  codigoCuenta: null,
  nombreComercialCuenta: null,
  idBodegas: [],
  scope: "platform",
  schemaName: null,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => nav.pathname,
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- mock de next/image en tests
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  TenantBodegaSelector: () => null,
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: {
      session: AuthSession;
      performLogout: () => Promise<void>;
    }) => unknown,
  ) =>
    selector({
      session: mockSession,
      performLogout: vi.fn(),
    }),
}));

vi.mock("@/hooks/shared/useLiveDate", () => ({
  useLiveDate: () => ({ label: "16-09-2026", dateTime: "2026-09-16" }),
}));

import { AppTopbar } from "./AppTopbar";

describe("AppTopbar — perfil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.pathname = "/dashboard";
    useOvFechaFiltroStore.getState().clear();
  });

  it("hace clicable el nombre y el rol hacia /perfil", () => {
    render(<AppTopbar />);

    const link = screen.getByRole("link", {
      name: "Abrir perfil de Super Configurador",
    });
    expect(link).toHaveAttribute("href", ROUTES.perfil);
    expect(link).toHaveTextContent("Super Configurador");
    expect(link).toHaveTextContent("Configurador TI");
  });

  it("en órdenes de venta, la fecha filtra ese día y se apaga al pulsar de nuevo", async () => {
    nav.pathname = ROUTES.dashboardVentasOrdenes;
    const user = userEvent.setup();
    render(<AppTopbar />);

    const fecha = screen.getByRole("button", {
      name: "Filtrar órdenes del 16-09-2026",
    });
    expect(fecha).toHaveAttribute("aria-pressed", "false");

    await user.click(fecha);
    expect(fecha).toHaveAttribute("aria-pressed", "true");
    expect(fecha).toHaveAccessibleName("Quitar filtro del 16-09-2026");
    expect(useOvFechaFiltroStore.getState().dia).toBe("2026-09-16");

    await user.click(fecha);
    expect(fecha).toHaveAttribute("aria-pressed", "false");
    expect(useOvFechaFiltroStore.getState().dia).toBeNull();
  });

  it("oculta Mateo IA cuando showMateoIa es false", () => {
    render(<AppTopbar showMateoIa={false} />);

    expect(
      screen.queryByRole("button", { name: "Abrir Mateo IA" }),
    ).not.toBeInTheDocument();
  });
});
