import { describe, expect, it, vi } from "vitest";
import { reloadWithCacheClear } from "./reload-with-cache-clear";

describe("reloadWithCacheClear", () => {
  it("borra caches, desregistra SW y recarga con _pv", async () => {
    const replace = vi.fn();
    const deleteCache = vi.fn().mockResolvedValue(true);
    const unregister = vi.fn().mockResolvedValue(true);
    const cachesApi = {
      keys: vi.fn().mockResolvedValue(["a", "b"]),
      delete: deleteCache,
    } as unknown as CacheStorage;
    const serviceWorkerContainer = {
      getRegistrations: vi
        .fn()
        .mockResolvedValue([{ unregister }, { unregister }]),
    } as unknown as ServiceWorkerContainer;

    await reloadWithCacheClear(
      { href: "https://app.polaria.tech/dashboard", replace },
      cachesApi,
      serviceWorkerContainer,
    );

    expect(deleteCache).toHaveBeenCalledTimes(2);
    expect(unregister).toHaveBeenCalledTimes(2);
    expect(replace).toHaveBeenCalledTimes(1);
    const target = String(replace.mock.calls[0]?.[0] ?? "");
    expect(target).toContain("https://app.polaria.tech/dashboard?");
    expect(target).toMatch(/_pv=\d+/);
  });
});
