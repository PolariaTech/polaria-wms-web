import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ORDENES_ROOT = path.resolve(
  process.cwd(),
  "src/modules/sales/ordenes",
);

const SCAN_ROOTS = ["components", "components/pages"] as const;

/** Rutas permitidas hacia la capa de IA (BFF / mateo / tipos de contrato). */
const ALLOWED_PATTERNS = [
  /\/api\/ventas\//,
  /mateo-ia/,
  /sales-ai\.api/,
  /leer-pedido/,
  /openai-pedido\.tipos/,
] as const;

/**
 * Excepción mínima: tipos de contrato compartidos con el mapper (sin cliente OpenAI).
 * Ver comentario en cada entrada.
 */
const PER_FILE_ALLOWLIST: Record<string, RegExp[]> = {
  // Sin violaciones hoy; reservado para tipos puros si hiciera falta.
};

const FORBIDDEN = [
  /\bfrom\s+["']openai["']/,
  /import\s+OpenAI\s+from\s+["']openai["']/,
  /openai-surtido/,
  /openai-pedido\.client/,
  /\.\.\/ai\/openai-pedido\.client/,
];

function collectTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTsFiles(full));
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

function relativeFromOrdenes(file: string): string {
  return path.relative(ORDENES_ROOT, file).replace(/\\/g, "/");
}

describe("arquitectura: puerta IA en órdenes (components)", () => {
  for (const root of SCAN_ROOTS) {
    const dir = path.join(ORDENES_ROOT, root);
    const files = collectTsFiles(dir);

    it(`${root} no importa OpenAI ni openai-surtido directo`, () => {
      const violations: string[] = [];

      for (const file of files) {
        const rel = relativeFromOrdenes(file);
        const content = fs.readFileSync(file, "utf8");
        const extraAllowed = PER_FILE_ALLOWLIST[rel] ?? [];

        for (const rule of FORBIDDEN) {
          if (!rule.test(content)) continue;
          const permitted = [...ALLOWED_PATTERNS, ...extraAllowed].some((p) =>
            p.test(content),
          );
          if (!permitted) {
            violations.push(`${rel}: coincide ${rule}`);
          }
        }
      }

      expect(violations).toEqual([]);
    });
  }
});