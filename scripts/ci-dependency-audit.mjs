#!/usr/bin/env node
/**
 * npm audit de producción con la misma barra que polaria-wms-api (high+),
 * más la excepción única documentada en docs/adr/ADR-005-xlsx-excepcion-audit.md.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adrPath = path.join(root, "docs/adr/ADR-005-xlsx-excepcion-audit.md");

/** @returns {{ ok: boolean, bloqueantes: string[], excepciones: string[] }} */
export function evaluarAuditJson(reportJson, adrExists) {
  if (!adrExists) {
    return {
      ok: false,
      bloqueantes: ["Falta ADR-005; no se puede aplicar excepción xlsx."],
      excepciones: [],
    };
  }

  const data = JSON.parse(reportJson);
  const vulns = data.vulnerabilities || {};
  const bloqueantes = [];
  const excepciones = [];

  for (const [name, meta] of Object.entries(vulns)) {
    const severity = String(meta?.severity || "").toLowerCase();
    if (severity !== "high" && severity !== "critical") continue;
    if (name === "xlsx") {
      excepciones.push(`${name}:${severity}`);
      continue;
    }
    bloqueantes.push(
      `${severity}\t${name}\tfixAvailable=${meta?.fixAvailable}`,
    );
  }

  return { ok: bloqueantes.length === 0, bloqueantes, excepciones };
}

function main() {
  if (!existsSync(adrPath)) {
    process.stderr.write("Falta ADR-005; no se puede aplicar excepción xlsx.\n");
    process.exit(1);
  }

  let report;
  try {
    report = execFileSync("npm", ["audit", "--omit=dev", "--json"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    report = error.stdout?.toString?.() || error.stdout || "";
    if (!report) {
      process.stderr.write(
        String(error.stderr?.toString?.() || error.message || error) + "\n",
      );
      process.exit(1);
    }
  }

  const resultado = evaluarAuditJson(report, true);
  for (const ex of resultado.excepciones) {
    process.stderr.write(`[ADR-005] Excepción audit: ${ex}\n`);
  }
  if (!resultado.ok) {
    process.stderr.write(
      "npm audit (producción) bloqueante:\n" +
        resultado.bloqueantes.join("\n") +
        "\n",
    );
    process.exit(1);
  }
  process.stdout.write(
    "npm audit OK (high+/critical limpios o solo excepción ADR-005 xlsx).\n",
  );
}

const invocacionDirecta =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invocacionDirecta) {
  main();
}
