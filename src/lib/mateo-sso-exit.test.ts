import { afterEach, describe, expect, it } from "vitest";
import {
  clearMateoSsoExitMark,
  isMateoSsoExitInProgress,
  markMateoSsoExit,
  MATEO_SSO_EXIT_KEY,
} from "./mateo-sso-exit";

describe("mateo-sso-exit", () => {
  afterEach(() => {
    sessionStorage.removeItem(MATEO_SSO_EXIT_KEY);
  });

  it("marca y detecta salida SSO en progreso", () => {
    expect(isMateoSsoExitInProgress()).toBe(false);
    markMateoSsoExit();
    expect(isMateoSsoExitInProgress()).toBe(true);
    clearMateoSsoExitMark();
    expect(isMateoSsoExitInProgress()).toBe(false);
  });
});
