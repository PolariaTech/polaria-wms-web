import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";

const { mockReplace } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: {
      session: {
        scope: string;
        codigoEmpresa: string | null;
      } | null;
      context: {
        scope: string;
        codigoEmpresa: string | null;
      } | null;
      isHydrated: boolean;
    }) => unknown,
  ) =>
    selector({
      session: mockAuthState.session,
      context: mockAuthState.context,
      isHydrated: mockAuthState.isHydrated,
    }),
}));

const mockAuthState = {
  session: null as {
    scope: string;
    codigoEmpresa: string | null;
  } | null,
  context: null as {
    scope: string;
    codigoEmpresa: string | null;
  } | null,
  isHydrated: true,
};

import { TenantScopeGuard } from "./TenantScopeGuard";

describe("TenantScopeGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.isHydrated = true;
    mockAuthState.session = null;
    mockAuthState.context = null;
  });

  it("renderiza hijos para sesión tenant con codigoEmpresa", () => {
    mockAuthState.session = {
      scope: "tenant",
      codigoEmpresa: "ACME",
    };

    const { getByText } = render(
      <TenantScopeGuard>
        <span>contenido tenant</span>
      </TenantScopeGuard>,
    );

    expect(getByText("contenido tenant")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirige a configurador si scope es platform", async () => {
    mockAuthState.session = {
      scope: "platform",
      codigoEmpresa: null,
    };

    render(
      <TenantScopeGuard>
        <span>contenido</span>
      </TenantScopeGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.configurator);
    });
  });

  it("redirige a login si scope tenant sin codigoEmpresa", async () => {
    mockAuthState.session = {
      scope: "tenant",
      codigoEmpresa: null,
    };

    render(
      <TenantScopeGuard>
        <span>contenido</span>
      </TenantScopeGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.login);
    });
  });
});
