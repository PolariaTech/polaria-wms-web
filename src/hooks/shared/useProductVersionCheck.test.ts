import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/constants/brand/brand", () => ({
  POLARIA_PRODUCT_VERSION: "2.12.86",
}));

vi.mock("@/lib/product-version/is-product-version-check-enabled", () => ({
  isProductVersionCheckEnabled: () => true,
}));

vi.mock("@/lib/product-version/fetch-deploy-product-version", () => ({
  fetchDeployProductVersion: vi.fn(),
}));

vi.mock("./useVisibleInterval", () => ({
  useVisibleInterval: vi.fn(),
}));

import { fetchDeployProductVersion } from "@/lib/product-version/fetch-deploy-product-version";
import { useProductVersionCheck } from "./useProductVersionCheck";

describe("useProductVersionCheck", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("marca updateAvailable cuando el deploy difiere del bundle", async () => {
    vi.mocked(fetchDeployProductVersion).mockResolvedValue("2.12.99");
    const { result } = renderHook(() => useProductVersionCheck());
    await waitFor(() => {
      expect(result.current.updateAvailable).toBe(true);
    });
  });

  it("no marca update si la versión coincide", async () => {
    vi.mocked(fetchDeployProductVersion).mockResolvedValue("2.12.86");
    const { result } = renderHook(() => useProductVersionCheck());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.updateAvailable).toBe(false);
  });

  it("no marca update si el fetch falla", async () => {
    vi.mocked(fetchDeployProductVersion).mockResolvedValue(null);
    const { result } = renderHook(() => useProductVersionCheck());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.updateAvailable).toBe(false);
  });
});
