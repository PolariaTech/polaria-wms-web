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
      session: { scope: string } | null;
      context: { scope: string } | null;
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
  session: null as { scope: string } | null,
  context: null as { scope: string } | null,
  isHydrated: true,
};

import { PlatformScopeGuard } from "./PlatformScopeGuard";

describe("PlatformScopeGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.isHydrated = true;
    mockAuthState.session = null;
    mockAuthState.context = null;
  });

  it("renderiza hijos para sesión platform", () => {
    mockAuthState.session = { scope: "platform" };

    const { getByText } = render(
      <PlatformScopeGuard>
        <span>panel configurador</span>
      </PlatformScopeGuard>,
    );

    expect(getByText("panel configurador")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirige a dashboard si scope es tenant", async () => {
    mockAuthState.session = { scope: "tenant" };

    render(
      <PlatformScopeGuard>
        <span>contenido</span>
      </PlatformScopeGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.dashboard);
    });
  });

  it("no renderiza hijos mientras no está hidratado", () => {
    mockAuthState.isHydrated = false;
    mockAuthState.session = { scope: "platform" };

    const { queryByText } = render(
      <PlatformScopeGuard>
        <span>panel configurador</span>
      </PlatformScopeGuard>,
    );

    expect(queryByText("panel configurador")).not.toBeInTheDocument();
  });

  it("usa scope del context si no hay sesión en memoria", () => {
    mockAuthState.context = { scope: "platform" };

    const { getByText } = render(
      <PlatformScopeGuard>
        <span>desde contexto</span>
      </PlatformScopeGuard>,
    );

    expect(getByText("desde contexto")).toBeInTheDocument();
  });
});
