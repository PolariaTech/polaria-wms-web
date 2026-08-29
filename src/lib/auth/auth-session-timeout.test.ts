import { describe, expect, it } from "vitest";
import {
  SESSION_MAX_AGE_MS,
  getSessionRemainingMs,
  isSessionExpired,
} from "./auth-session-timeout";

describe("auth-session-timeout", () => {
  it("expira si no hay marca de inicio (sesión legacy)", () => {
    expect(isSessionExpired(null)).toBe(true);
    expect(isSessionExpired(undefined)).toBe(true);
    expect(isSessionExpired(Number.NaN)).toBe(true);
  });

  it("no expira dentro de las 12 horas", () => {
    const now = 1_700_000_000_000;
    expect(isSessionExpired(now - SESSION_MAX_AGE_MS + 1, now)).toBe(false);
  });

  it("expira exactamente a las 12 horas", () => {
    const now = 1_700_000_000_000;
    expect(isSessionExpired(now - SESSION_MAX_AGE_MS, now)).toBe(true);
  });

  it("calcula el tiempo restante hasta el cierre", () => {
    const now = 1_700_000_000_000;
    const started = now - SESSION_MAX_AGE_MS + 5_000;
    expect(getSessionRemainingMs(started, now)).toBe(5_000);
    expect(getSessionRemainingMs(null, now)).toBe(0);
  });
});
