import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { evaluarMaxLines } from "./max-lines-gate.mjs";

describe("max-lines-gate", () => {
  it("deja pasar un archivo bajo el tope sin baseline", () => {
    assert.deepEqual(evaluarMaxLines({ "a.ts": 120 }, {}), []);
  });

  it("bloquea un archivo nuevo por encima de 300", () => {
    const fallos = evaluarMaxLines({ "a.ts": 301 }, {});
    assert.equal(fallos.length, 1);
    assert.match(fallos[0], /nuevo/);
  });

  it("bloquea crecimiento sobre el baseline", () => {
    const fallos = evaluarMaxLines({ "a.ts": 310 }, { "a.ts": 309 });
    assert.equal(fallos.length, 1);
    assert.match(fallos[0], /baseline/);
  });

  it("permite achicar un archivo del baseline", () => {
    assert.deepEqual(evaluarMaxLines({ "a.ts": 200 }, { "a.ts": 340 }), []);
  });
});
