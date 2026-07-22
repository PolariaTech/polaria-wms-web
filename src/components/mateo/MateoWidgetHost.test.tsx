import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockConfigureTokenFetcher,
  mockMount,
  mockClose,
  mockLoadMateoWidgetApi,
  mockUseAuthStore,
  mockShowToast,
  mockApiRequest,
} = vi.hoisted(() => ({
  mockConfigureTokenFetcher: vi.fn(),
  mockMount: vi.fn().mockResolvedValue(undefined),
  mockClose: vi.fn(),
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

import { MateoWidgetHost } from "./MateoWidgetHost";

function mockSession(accessToken: string | null, isHydrated = true) {
  mockUseAuthStore.mockImplementation(
    (selector: (s: { isHydrated: boolean; accessToken: string | null }) => unknown) =>
      selector({ isHydrated, accessToken }),
  );
}

describe("MateoWidgetHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadMateoWidgetApi.mockResolvedValue({
      configureTokenFetcher: mockConfigureTokenFetcher,
      mount: mockMount,
      unmount: vi.fn(),
      close: mockClose,
    });
    mockApiRequest.mockResolvedValue({ token: "widget-jwt", expiresIn: 300 });
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
      expiresIn: 3600,
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
    expect(mockLoadMateoWidgetApi).toHaveBeenCalledTimes(1);
  });
});
