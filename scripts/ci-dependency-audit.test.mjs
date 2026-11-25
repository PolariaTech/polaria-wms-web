import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  evaluarAuditJson,
  evaluarXlsxLock,
} from "./ci-dependency-audit.mjs";

describe("evaluarAuditJson", () => {
  it("pasa con un reporte vacío", () => {
    const r = evaluarAuditJson(JSON.stringify({ vulnerabilities: {} }));
    assert.equal(r.ok, true);
    assert.deepEqual(r.bloqueantes, []);
  });

  it("bloquea high y critical sin excepciones, incluido xlsx", () => {
    const r = evaluarAuditJson(
      JSON.stringify({
        vulnerabilities: {
          xlsx: { severity: "high", fixAvailable: false },
          zod: { severity: "critical", fixAvailable: true },
        },
      }),
    );
    assert.equal(r.ok, false);
    assert.equal(r.bloqueantes.length, 2);
    assert.ok(r.bloqueantes.some((l) => l.includes("xlsx")));
    assert.ok(r.bloqueantes.some((l) => l.includes("zod")));
  });

  it("ignora moderate y low", () => {
    const r = evaluarAuditJson(
      JSON.stringify({
        vulnerabilities: {
          exceljs: { severity: "moderate", fixAvailable: true },
          leftpad: { severity: "low", fixAvailable: true },
        },
      }),
    );
    assert.equal(r.ok, true);
  });
});

describe("evaluarXlsxLock", () => {
  const lockCon = (entrada) =>
    JSON.stringify({ packages: { "node_modules/xlsx": entrada } });

  it("pasa si xlsx no está en el lock", () => {
    assert.equal(evaluarXlsxLock(JSON.stringify({ packages: {} })).ok, true);
  });

  it("pasa con 0.20.3 desde el CDN oficial y con integrity", () => {
    const r = evaluarXlsxLock(
      lockCon({
        version: "0.20.3",
        resolved: "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz",
        integrity: "sha512-abc",
      }),
    );
    assert.equal(r.ok, true);
  });

  it("acepta una versión posterior a la mínima", () => {
    const r = evaluarXlsxLock(
      lockCon({
        version: "0.21.0",
        resolved: "https://cdn.sheetjs.com/xlsx-0.21.0/xlsx-0.21.0.tgz",
        integrity: "sha512-abc",
      }),
    );
    assert.equal(r.ok, true);
  });

  it("bloquea la versión vulnerable del registro npm", () => {
    const r = evaluarXlsxLock(
      lockCon({
        version: "0.18.5",
        resolved: "https://registry.npmjs.org/xlsx/-/xlsx-0.18.5.tgz",
        integrity: "sha512-abc",
      }),
    );
    assert.equal(r.ok, false);
    assert.equal(r.bloqueantes.length, 2);
  });

  it("bloquea un origen no oficial y la falta de integrity", () => {
    const r = evaluarXlsxLock(
      lockCon({
        version: "0.20.3",
        resolved: "https://ejemplo.com/xlsx-0.20.3.tgz",
      }),
    );
    assert.equal(r.ok, false);
    assert.equal(r.bloqueantes.length, 2);
  });

  it("falla con mensaje claro si el JSON está malformado", () => {
    assert.throws(() => evaluarAuditJson("{roto"), /JSON inválido/);
    assert.throws(() => evaluarXlsxLock("{roto"), /JSON inválido/);
  });
});
