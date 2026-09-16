import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import type { AuthSession } from "@/types/auth/auth";

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
  usePathname: () => "/dashboard",
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
});
