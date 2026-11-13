import { afterEach, describe, expect, it, vi } from "vitest";
import { isProductVersionCheckEnabled } from "./is-product-version-check-enabled";

describe("isProductVersionCheckEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("está apagado fuera de production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isProductVersionCheckEnabled()).toBe(false);
  });

  it("está encendido en production (REQ-293)", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isProductVersionCheckEnabled()).toBe(true);
  });
});
