import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import {
  useVentasMenuStore,
  VENTAS_MENU_ID,
} from "@/modules/sales/correos/components/VentasSidebar";
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

  it("en órdenes de venta, la fecha filtra hoy y mañana y se apaga al pulsar de nuevo", async () => {
    nav.pathname = ROUTES.dashboardVentasOrdenes;
    const user = userEvent.setup();
    render(<AppTopbar />);

    const fecha = screen.getByRole("button", {
      name: "Filtrar por fecha de entrega de hoy y mañana (16-09-2026)",
    });
    expect(fecha).toHaveAttribute("aria-pressed", "false");
    expect(fecha).toHaveTextContent("Fecha");

    await user.click(fecha);
    expect(fecha).toHaveAttribute("aria-pressed", "true");
    expect(fecha).toHaveTextContent("Hoy y mañana");
    expect(fecha).toHaveAccessibleName(
      "Quitar filtro de entrega de hoy y mañana (16-09-2026)",
    );
    expect(useOvFechaFiltroStore.getState().dia).toBe("2026-09-16");

    await user.click(fecha);
    expect(fecha).toHaveAttribute("aria-pressed", "false");
    expect(useOvFechaFiltroStore.getState().dia).toBeNull();
  });

  describe("botón del menú de Ventas (REQ-104)", () => {
    const rolOriginal = mockSession.idRol;
    const MOSTRAR = "Mostrar menú de Ventas";
    const OCULTAR = "Ocultar menú de Ventas";

    beforeEach(() => {
      useVentasMenuStore.setState({ abierto: true });
    });
    afterEach(() => {
      mockSession.idRol = rolOriginal;
      useVentasMenuStore.setState({ abierto: true });
    });

    it("despliega y oculta el menú, y su nombre dice qué hará al pulsarlo", async () => {
      mockSession.idRol = "operador_cuenta";
      nav.pathname = ROUTES.dashboardVentasOrdenes;
      const user = userEvent.setup();
      render(<AppTopbar />);

      const boton = screen.getByRole("button", { name: OCULTAR });
      expect(boton).toHaveAttribute("aria-expanded", "true");
      expect(boton).toHaveAttribute("aria-controls", VENTAS_MENU_ID);

      await user.click(boton);
      expect(useVentasMenuStore.getState().abierto).toBe(false);
      const cerrado = screen.getByRole("button", { name: MOSTRAR });
      expect(cerrado).toHaveAttribute("aria-expanded", "false");

      await user.click(cerrado);
      expect(useVentasMenuStore.getState().abierto).toBe(true);
    });

    it("no aparece fuera de Ventas", () => {
      mockSession.idRol = "operador_cuenta";
      nav.pathname = "/dashboard";
      render(<AppTopbar />);
      expect(screen.queryByRole("button", { name: OCULTAR })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: MOSTRAR })).not.toBeInTheDocument();
    });

    it("no aparece para roles que no son de cuenta", () => {
      nav.pathname = ROUTES.dashboardVentasOrdenes;
      render(<AppTopbar />);
      expect(screen.queryByRole("button", { name: OCULTAR })).not.toBeInTheDocument();
    });
  });

  it("oculta Mateo IA cuando showMateoIa es false", () => {
    render(<AppTopbar showMateoIa={false} />);

    expect(
      screen.queryByRole("button", { name: "Abrir Mateo IA" }),
    ).not.toBeInTheDocument();
  });
});
