#!/usr/bin/env node
/**
 * Score-10 P2: tope de líneas en ventas/compras.
 * Un archivo nuevo no puede pasar de MAX. Uno ya registrado no puede crecer
 * por encima de su baseline (scripts/max-lines-baseline.json).
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX = 300;
const ROOTS = [
  "src/modules/sales",
  "src/modules/purchases",
];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = path.join(root, "scripts/max-lines-baseline.json");

function walk(dir, out) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "_archived") continue;
      walk(full, out);
      continue;
    }
    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
    if (name.includes(".test.") || name.endsWith(".spec.ts")) continue;
    const lines = readFileSync(full, "utf8").split("\n").length;
    out[path.relative(root, full)] = lines;
  }
}

export function evaluarMaxLines(actual, baseline) {
  const fallos = [];
  for (const [file, lines] of Object.entries(actual)) {
    const previo = baseline[file];
    if (previo == null) {
      if (lines > MAX) {
        fallos.push(`${file}: ${lines} líneas (nuevo, tope ${MAX})`);
      }
      continue;
    }
    if (lines > previo) {
      fallos.push(
        `${file}: ${lines} > baseline ${previo} (no puede crecer; parte el archivo)`,
      );
    }
  }
  return fallos;
}

function main() {
  const actual = {};
  for (const rel of ROOTS) walk(path.join(root, rel), actual);
  const baseline = existsSync(baselinePath)
    ? JSON.parse(readFileSync(baselinePath, "utf8"))
    : {};
  const fallos = evaluarMaxLines(actual, baseline);
  if (fallos.length) {
    process.stderr.write(
      "max-lines (ventas/compras) bloqueante:\n" + fallos.join("\n") + "\n",
    );
    process.exit(1);
  }
  process.stdout.write(
    `max-lines OK (${Object.keys(actual).length} archivos; tope nuevo ${MAX}).\n`,
  );
}

const directo =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (directo) main();
