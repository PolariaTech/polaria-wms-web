import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluarAuditJson } from "./ci-dependency-audit.mjs";

describe("ci-dependency-audit", () => {
  it("falla sin ADR aunque el reporte esté vacío", () => {
    const r = evaluarAuditJson(JSON.stringify({ vulnerabilities: {} }), false);
    assert.equal(r.ok, false);
    assert.match(r.bloqueantes[0] || "", /ADR-005/);
  });

  it("permite solo xlsx high y bloquea otras high", () => {
    const r = evaluarAuditJson(
      JSON.stringify({
        vulnerabilities: {
          xlsx: { severity: "high", fixAvailable: false },
          zod: { severity: "high", fixAvailable: true },
        },
      }),
      true,
    );
    assert.equal(r.ok, false);
    assert.deepEqual(r.excepciones, ["xlsx:high"]);
    assert.ok(r.bloqueantes.some((l) => l.includes("zod")));
  });

  it("pasa con solo excepción xlsx", () => {
    const r = evaluarAuditJson(
      JSON.stringify({
        vulnerabilities: {
          xlsx: { severity: "high", fixAvailable: false },
          leftpad: { severity: "moderate", fixAvailable: true },
        },
      }),
      true,
    );
    assert.equal(r.ok, true);
    assert.deepEqual(r.excepciones, ["xlsx:high"]);
  });
});
