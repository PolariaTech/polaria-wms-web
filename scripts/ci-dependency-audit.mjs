#!/usr/bin/env node
/**
 * npm audit de producción con la misma barra que polaria-wms-api (high+), sin excepciones.
 *
 * Punto ciego conocido: npm audit no analiza dependencias que vienen de una URL. xlsx se instala
 * desde cdn.sheetjs.com (el registro npm quedó en 0.18.5, con vulnerabilidades high sin parche), así
 * que además se valida el lockfile: versión mínima parcheada, origen oficial e integridad registrada.
 * Ver docs/adr/ADR-005-xlsx-excepcion-audit.md.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const XLSX_VERSION_MINIMA = [0, 20, 3];
export const XLSX_ORIGEN_PERMITIDO = "https://cdn.sheetjs.com/";

function versionAtupla(version) {
  return String(version || "")
    .split(".")
    .map((parte) => Number.parseInt(parte, 10) || 0);
}

function esMenorQue(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diferencia = (a[i] ?? 0) - (b[i] ?? 0);
    if (diferencia !== 0) return diferencia < 0;
  }
  return false;
}

function parsearJsonSeguro(raw, etiqueta) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    throw new Error(`JSON inválido en ${etiqueta}: ${detalle}`);
  }
}

/** @returns {{ ok: boolean, bloqueantes: string[] }} */
export function evaluarAuditJson(reportJson) {
  const data = parsearJsonSeguro(reportJson, "reporte de npm audit");
  const vulns = data?.vulnerabilities || {};
  const bloqueantes = [];

  for (const [name, meta] of Object.entries(vulns)) {
    const severity = String(meta?.severity || "").toLowerCase();
    if (severity !== "high" && severity !== "critical") continue;
    bloqueantes.push(
      `${severity}\t${name}\tfixAvailable=${meta?.fixAvailable}`,
    );
  }

  return { ok: bloqueantes.length === 0, bloqueantes };
}

/**
 * Valida que xlsx, que npm audit no ve por venir de una URL, siga en una versión parcheada
 * desde el origen oficial y con integridad registrada. Si xlsx no está en el lock, no hay nada que validar.
 * @returns {{ ok: boolean, bloqueantes: string[] }}
 */
export function evaluarXlsxLock(lockJson) {
  const lock = parsearJsonSeguro(lockJson, "package-lock.json");
  const entrada = lock?.packages?.["node_modules/xlsx"];
  if (!entrada) return { ok: true, bloqueantes: [] };

  const bloqueantes = [];
  if (esMenorQue(versionAtupla(entrada.version), XLSX_VERSION_MINIMA)) {
    bloqueantes.push(
      `xlsx ${entrada.version} es menor que ${XLSX_VERSION_MINIMA.join(".")} (versiones previas tienen vulnerabilidades high sin parche en npm)`,
    );
  }
  if (!String(entrada.resolved || "").startsWith(XLSX_ORIGEN_PERMITIDO)) {
    bloqueantes.push(
      `xlsx se resuelve desde "${entrada.resolved}"; solo se permite ${XLSX_ORIGEN_PERMITIDO}`,
    );
  }
  if (!entrada.integrity) {
    bloqueantes.push("xlsx no tiene integrity en package-lock.json");
  }
  return { ok: bloqueantes.length === 0, bloqueantes };
}

function main() {
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

  const audit = evaluarAuditJson(report);
  const xlsx = evaluarXlsxLock(
    readFileSync(path.join(root, "package-lock.json"), "utf8"),
  );

  if (!audit.ok) {
    process.stderr.write(
      "npm audit (producción) bloqueante:\n" +
        audit.bloqueantes.join("\n") +
        "\n",
    );
  }
  if (!xlsx.ok) {
    process.stderr.write(
      "xlsx (fuera del alcance de npm audit) bloqueante:\n" +
        xlsx.bloqueantes.join("\n") +
        "\n",
    );
  }
  if (!audit.ok || !xlsx.ok) process.exit(1);

  process.stdout.write(
    "npm audit OK (sin high/critical) y xlsx validado en el lockfile.\n",
  );
}

const invocacionDirecta =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invocacionDirecta) {
  main();
}
