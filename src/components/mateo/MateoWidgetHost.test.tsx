import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockConfigureTokenFetcher,
  mockMount,
  mockClose,
  mockUnmount,
  mockResetAuth,
  mockLoadMateoWidgetApi,
  mockUseAuthStore,
  mockShowToast,
  mockApiRequest,
} = vi.hoisted(() => ({
  mockConfigureTokenFetcher: vi.fn(),
  mockMount: vi.fn().mockResolvedValue(undefined),
  mockClose: vi.fn(),
  mockUnmount: vi.fn(),
  mockResetAuth: vi.fn(),
  mockLoadMateoWidgetApi: vi.fn(),
  mockUseAuthStore: vi.fn(),
  mockShowToast: vi.fn(),
  mockApiRequest: vi.fn(),
}));

vi.mock("./load-mateo-widget", () => ({
  loadMateoWidgetApi: (...args: unknown[]) => mockLoadMateoWidgetApi(...args),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: {
    isHydrated: boolean;
    accessToken: string | null;
  }) => unknown) => mockUseAuthStore(selector),
}));

vi.mock("@/components/shared/toast/PolariaToastProvider", () => ({
  usePolariaToast: () => ({ showToast: mockShowToast }),
}));

vi.mock("@/services/api/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

vi.mock("@/config/env", () => ({
  env: {
    mateoWidgetScriptUrl: "https://widget.example.com/mateo-widget.js",
    mateoN8nWebhookUrl: "",
  },
}));

import { SESSION_MAX_AGE_MS } from "@/lib/auth/auth-session-timeout";
import { useShellOverlayStore } from "@/stores/shell-overlay.store";
import { MateoWidgetHost } from "./MateoWidgetHost";
import { CLAVE_MATEO_LANZADOR_OCULTO } from "./useMateoLanzadorOculto";

function mockSession(accessToken: string | null, isHydrated = true) {
  mockUseAuthStore.mockImplementation(
    (selector: (s: { isHydrated: boolean; accessToken: string | null }) => unknown) =>
      selector({ isHydrated, accessToken }),
  );
}

describe("MateoWidgetHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useShellOverlayStore.getState().setCypherOpen(false);
    mockLoadMateoWidgetApi.mockResolvedValue({
      configureTokenFetcher: mockConfigureTokenFetcher,
      mount: mockMount,
      unmount: mockUnmount,
      close: mockClose,
      resetAuth: mockResetAuth,
    });
    mockApiRequest.mockResolvedValue({
      token: "widget-jwt",
      expiresIn: SESSION_MAX_AGE_MS / 1000,
    });
  });

  it("no renderiza sin sesión (no hydrated o sin accessToken)", () => {
    mockSession(null);

    const { container } = render(<MateoWidgetHost />);
    expect(container.firstChild).toBeNull();
    expect(mockLoadMateoWidgetApi).not.toHaveBeenCalled();
  });

  it("no renderiza si aún no hidrató el store", () => {
    mockSession("token", false);

    const { container } = render(<MateoWidgetHost />);
    expect(container.firstChild).toBeNull();
  });

  it("monta el host y configura configureTokenFetcher con sesión", async () => {
    mockSession("access-token");

    render(<MateoWidgetHost />);

    expect(screen.getByTestId("mateo-widget-host")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockConfigureTokenFetcher).toHaveBeenCalledTimes(1);
      expect(mockMount).toHaveBeenCalled();
    });

    const mountArgs = mockMount.mock.calls[0]?.[1] as {
      onAuthError?: () => void;
      conversationTokenFetcher?: () => Promise<{ token: string; expiresIn: number }>;
    };
    expect(mountArgs.conversationTokenFetcher).toBeTypeOf("function");
    await expect(mountArgs.conversationTokenFetcher?.()).resolves.toEqual({
      token: "access-token",
      expiresIn: SESSION_MAX_AGE_MS / 1000,
    });
  });

  it("muestra toast si falla la carga del script del widget", async () => {
    mockSession("access-token");
    mockLoadMateoWidgetApi.mockRejectedValue(new Error("script 404"));

    render(<MateoWidgetHost />);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "error",
          title: "Mateo widget",
        }),
      );
    });
  });

  it("cierra el widget y avisa cuando onAuthError se dispara", async () => {
    mockSession("access-token");

    render(<MateoWidgetHost />);

    await waitFor(() => expect(mockMount).toHaveBeenCalled());

    const mountArgs = mockMount.mock.calls[0]?.[1] as {
      onAuthError?: () => void;
    };
    mountArgs.onAuthError?.();

    expect(mockClose).toHaveBeenCalled();
    expect(mockResetAuth).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "error",
        title: "Sesión expirada",
      }),
    );
  });

  it("deja de renderizar el host cuando la sesión expira", async () => {
    mockSession("access-token");

    const { rerender } = render(<MateoWidgetHost />);
    await waitFor(() => expect(mockMount).toHaveBeenCalled());

    mockSession(null);
    rerender(<MateoWidgetHost />);

    expect(screen.queryByTestId("mateo-widget-host")).not.toBeInTheDocument();
    expect(mockClose).toHaveBeenCalled();
    expect(mockResetAuth).toHaveBeenCalled();
    expect(mockUnmount).toHaveBeenCalled();
    expect(mockLoadMateoWidgetApi).toHaveBeenCalledTimes(1);
  });

  it("oculta el launcher cuando el Cypher está abierto", () => {
    mockSession("access-token");
    useShellOverlayStore.getState().setCypherOpen(true);

    render(<MateoWidgetHost />);

    const host = screen.getByTestId("mateo-widget-host");
    expect(host).toHaveAttribute("data-cypher-open", "true");
    expect(host).toHaveAttribute("aria-hidden", "true");
    expect(host.className).toMatch(/opacity-0/);
    expect(host.className).toMatch(/transition-opacity/);
  });

  describe("pestaña para esconder el botón flotante", () => {
    beforeEach(() => window.localStorage.clear());

    it("aparece cuando el widget cargó, con Mateo visible", async () => {
      mockSession("access-token");
      render(<MateoWidgetHost />);

      const pestana = await screen.findByRole("button", { name: "Ocultar Mateo Soporte" });
      expect(pestana).toBeInTheDocument();
      expect(screen.getByTestId("mateo-widget-host")).toHaveAttribute("data-launcher-hidden", "false");
    });

    it("al ocultar, apaga el widget, cierra el chat y recuerda la elección", async () => {
      mockSession("access-token");
      render(<MateoWidgetHost />);

      await userEvent.click(await screen.findByRole("button", { name: "Ocultar Mateo Soporte" }));

      const host = screen.getByTestId("mateo-widget-host");
      expect(host).toHaveAttribute("data-launcher-hidden", "true");
      expect(host).toHaveAttribute("aria-hidden", "true");
      expect(host.className).toMatch(/opacity-0/);
      expect(mockClose).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Mostrar Mateo Soporte" })).toBeInTheDocument();
      expect(window.localStorage.getItem(CLAVE_MATEO_LANZADOR_OCULTO)).toBe("1");
    });

    it("al mostrarlo de nuevo vuelve el botón flotante", async () => {
      mockSession("access-token");
      render(<MateoWidgetHost />);

      await userEvent.click(await screen.findByRole("button", { name: "Ocultar Mateo Soporte" }));
      await userEvent.click(screen.getByRole("button", { name: "Mostrar Mateo Soporte" }));

      const host = screen.getByTestId("mateo-widget-host");
      expect(host).toHaveAttribute("data-launcher-hidden", "false");
      expect(host.className).toMatch(/opacity-100/);
    });

    it("si ya estaba escondido al entrar, arranca escondido", async () => {
      window.localStorage.setItem(CLAVE_MATEO_LANZADOR_OCULTO, "1");
      mockSession("access-token");
      render(<MateoWidgetHost />);

      expect(await screen.findByRole("button", { name: "Mostrar Mateo Soporte" })).toBeInTheDocument();
      expect(screen.getByTestId("mateo-widget-host")).toHaveAttribute("data-launcher-hidden", "true");
    });

    it("con Cypher abierto la pestaña también se esconde para no tapar el panel", async () => {
      mockSession("access-token");
      render(<MateoWidgetHost />);
      await screen.findByRole("button", { name: "Ocultar Mateo Soporte" });

      act(() => useShellOverlayStore.getState().setCypherOpen(true));

      expect(screen.queryByTestId("mateo-launcher-tab")).not.toBeInTheDocument();
    });
  });
});
