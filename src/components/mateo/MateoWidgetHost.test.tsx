import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockConfigureTokenFetcher,
  mockMount,
  mockLoadMateoWidgetApi,
  mockUseAuthStore,
  mockShowToast,
} = vi.hoisted(() => ({
  mockConfigureTokenFetcher: vi.fn(),
  mockMount: vi.fn().mockResolvedValue(undefined),
  mockLoadMateoWidgetApi: vi.fn(),
  mockUseAuthStore: vi.fn(),
  mockShowToast: vi.fn(),
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
  apiRequest: vi.fn(),
}));

vi.mock("@/config/env", () => ({
  env: {
    mateoWidgetScriptUrl: "https://widget.example.com/mateo-widget.js",
    mateoN8nWebhookUrl: "",
  },
}));

import { MateoWidgetHost } from "./MateoWidgetHost";

describe("MateoWidgetHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadMateoWidgetApi.mockResolvedValue({
      configureTokenFetcher: mockConfigureTokenFetcher,
      mount: mockMount,
      unmount: vi.fn(),
      close: vi.fn(),
    });
  });

  it("no renderiza sin sesión (no hydrated o sin accessToken)", () => {
    mockUseAuthStore.mockImplementation(
      (selector: (s: { isHydrated: boolean; accessToken: string | null }) => unknown) =>
        selector({ isHydrated: true, accessToken: null }),
    );

    const { container } = render(<MateoWidgetHost />);
    expect(container.firstChild).toBeNull();
    expect(mockLoadMateoWidgetApi).not.toHaveBeenCalled();
  });

  it("no renderiza si aún no hidrató el store", () => {
    mockUseAuthStore.mockImplementation(
      (selector: (s: { isHydrated: boolean; accessToken: string | null }) => unknown) =>
        selector({ isHydrated: false, accessToken: "token" }),
    );

    const { container } = render(<MateoWidgetHost />);
    expect(container.firstChild).toBeNull();
  });

  it("monta el host y configura configureTokenFetcher con sesión", async () => {
    mockUseAuthStore.mockImplementation(
      (selector: (s: { isHydrated: boolean; accessToken: string | null }) => unknown) =>
        selector({ isHydrated: true, accessToken: "access-token" }),
    );

    render(<MateoWidgetHost />);

    expect(screen.getByTestId("mateo-widget-host")).toBeInTheDocument();

    await vi.waitFor(() => {
      expect(mockConfigureTokenFetcher).toHaveBeenCalledTimes(1);
      expect(mockMount).toHaveBeenCalled();
    });
  });
});
