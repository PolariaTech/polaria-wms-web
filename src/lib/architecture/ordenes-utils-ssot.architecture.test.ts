import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Score-10 P1: utils de pedido en web no deben reintroducir barrels compat
 * en la raíz de ordenes/utils (SSOT = subcarpetas origen/pedido/match/ot + Mateo/Nest).
 */
const UTILS_ROOT = path.resolve(
  process.cwd(),
  "src/modules/sales/ordenes/utils",
);

/** Basenames alineados al manifesto Mateo/Nest — no deben vivir como re-export en la raíz. */
const MATEO_SYNC_BASENAMES = new Set([
  "correo-chrome.ts",
  "resolve-cantidad-envase.ts",
  "centro-consumo-vs-cliente.ts",
  "origen-correo-ordenes-trabajo.ts",
  "texto-origen-pedido.ts",
  "stamp-origen-correo-meta.ts",
]);

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith("_archived")) continue;
      out.push(...listTsFiles(full));
      continue;
    }
    if (name.endsWith(".ts") && !name.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

describe("ordenes/utils SSOT (arquitectura)", () => {
  it("no hay barrels Compat re-export en la raíz de ordenes/utils", () => {
    const rootFiles = readdirSync(UTILS_ROOT).filter(
      (n) => n.endsWith(".ts") && !n.endsWith(".test.ts"),
    );
    const barrels = rootFiles.filter((name) => {
      const text = readFileSync(path.join(UTILS_ROOT, name), "utf8");
      return /Compat re-export/i.test(text);
    });
    expect(barrels).toEqual([]);
  });

  it("basenames Mateo-sync no reaparecen como archivo suelto en la raíz", () => {
    const rootFiles = new Set(
      readdirSync(UTILS_ROOT).filter((n) => n.endsWith(".ts")),
    );
    const choque = [...MATEO_SYNC_BASENAMES].filter((b) => rootFiles.has(b));
    expect(choque).toEqual([]);
  });

  it("cubre el árbol ordenes/utils (origen/pedido/match/ot presentes)", () => {
    const files = listTsFiles(UTILS_ROOT);
    expect(files.length).toBeGreaterThan(20);
    const rel = files.map((f) => path.relative(UTILS_ROOT, f));
    expect(rel.some((r) => r.startsWith(`origen${path.sep}`))).toBe(true);
    expect(rel.some((r) => r.startsWith(`pedido${path.sep}`))).toBe(true);
  });
});
