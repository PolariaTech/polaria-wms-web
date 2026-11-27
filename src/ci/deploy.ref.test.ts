/**
 * Contrato del input `ref` en `.github/workflows/deploy.yml`: opcional (vacío = tip de main)
 * y solo admite un tag vX.Y.Z o el commit actual de main (misma regla que API y mateo).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  join(__dirname, "../../.github/workflows/deploy.yml"),
  "utf8",
);

/** Misma condición que el paso «Validar ref» del workflow. */
const refPermitido = (ref: string, githubSha: string): boolean =>
  /^v[0-9]+\.[0-9]+\.[0-9]+$/.test(ref) || ref === githubSha;

describe("deploy.yml: ref opcional y Validar ref", () => {
  it("declara ref opcional con default vacío", () => {
    expect(workflow).toMatch(
      /ref:\s*\n(?:[^\n]*\n)*?\s+required:\s*false/,
    );
    expect(workflow).toMatch(/default:\s*""/);
  });

  it("tiene el paso Validar ref con REF = inputs.ref || github.sha", () => {
    expect(workflow).toContain(
      "Validar ref (tag de versión o commit actual de main)",
    );
    expect(workflow).toContain("REF: ${{ inputs.ref || github.sha }}");
    expect(workflow).toContain(
      '[[ ! "${REF}" =~ ^v[0-9]+\\.[0-9]+\\.[0-9]+$ && "${REF}" != "${GITHUB_SHA}" ]]',
    );
  });

  it("el checkout del código usa inputs.ref || github.sha", () => {
    expect(workflow).toContain("ref: ${{ inputs.ref || github.sha }}");
  });

  it.each([
    ["v2.13.23", "abc123"],
    ["v0.0.1", "abc123"],
    [
      "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    ],
  ])("acepta ref=%s con GITHUB_SHA=%s", (ref, githubSha) => {
    expect(refPermitido(ref, githubSha)).toBe(true);
  });

  it.each([
    ["feature/otra-rama", "abc123"],
    ["main", "abc123"],
    ["v2.13", "abc123"],
    ["v2.13.23-beta", "abc123"],
    ["ffff", "abc123"],
  ])("rechaza ref=%s", (ref, githubSha) => {
    expect(refPermitido(ref, githubSha)).toBe(false);
  });
});
