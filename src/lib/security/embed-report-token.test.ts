import { describe, expect, it } from "vitest";
import {
  EMBED_REPORT_TOKEN_TTL_MS,
  mintEmbedReportToken,
  verifyEmbedReportToken,
} from "./embed-report-token";

describe("embed-report-token", () => {
  it("emite token verificable con codigo de cuenta", () => {
    const token = mintEmbedReportToken("JBR");
    const payload = verifyEmbedReportToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.c).toBe("JBR");
    expect(payload?.exp).toBeGreaterThan(Date.now());
    expect(payload?.exp).toBeLessThanOrEqual(
      Date.now() + EMBED_REPORT_TOKEN_TTL_MS + 1000,
    );
  });

  it("rechaza token alterado", () => {
    const token = mintEmbedReportToken("JBR");
    const tampered = `${token.slice(0, -4)}xxxx`;
    expect(verifyEmbedReportToken(tampered)).toBeNull();
  });

  it("rechaza token vacío o mal formado", () => {
    expect(verifyEmbedReportToken("")).toBeNull();
    expect(verifyEmbedReportToken("sin-punto")).toBeNull();
  });
});
