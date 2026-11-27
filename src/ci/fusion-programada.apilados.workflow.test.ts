// @vitest-environment node
/**
 * Fusión programada: PR apilados en la misma ejecución, comprobaciones obligatorias, UNKNOWN y forks.
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  ejecutar,
  Escenario,
  hayHerramientas,
  limpiarEscenarios,
  llamadasA,
  numerosDe,
  pr,
  VERCEL,
} from "./__tests__/fusion-programada.arnes";

const describeSiHayHerramientas = hayHerramientas ? describe : describe.skip;

/** Padre (#7), hijo (#8) y nieto (#9): los apilados solo tienen la comprobación de Vercel. */
const apilados = (cambios: Partial<Escenario> = {}): Escenario => ({
  prs: [
    pr(7),
    pr(8, { baseRefName: "dani/pr-7", statusCheckRollup: [VERCEL] }),
    pr(9, { baseRefName: "dani/pr-8", statusCheckRollup: [VERCEL] }),
  ],
  hijos: { "dani/pr-7": [8], "dani/pr-8": [9] },
  atras: { 8: 1, 9: 1 },
  ...cambios,
});

afterEach(limpiarEscenarios);

describeSiHayHerramientas("fusión programada: apilados en la misma ejecución", () => {
  it("fusiona padre, hijo y nieto tras actualizar cada hijo, con un solo Deploy", () => {
    const resultado = ejecutar(apilados());
    expect(resultado.codigo).toBe(0);
    expect(numerosDe(resultado, "pr merge")).toEqual(["7", "8", "9"]);
    expect(numerosDe(resultado, "pr update-branch")).toEqual(["8", "9"]);
    expect(resultado.tokensDeActualizar).toEqual(["token-de-la-app", "token-de-la-app"]);
    expect(llamadasA(resultado, "api --method POST")).toHaveLength(1);
  });

  it("no fusiona un hijo mientras solo responda Vercel y el CI no aparezca", () => {
    const resultado = ejecutar(apilados({ comprobaciones: { 8: ["sinCi"] } }));
    expect(resultado.codigo).toBe(0);
    expect(numerosDe(resultado, "pr merge")).toEqual(["7"]);
    expect(resultado.resumen).toContain("EN ESPERA #8");
  });

  it("omite un hijo con la etiqueta no-fusionar sin tocar su rama", () => {
    const resultado = ejecutar({
      prs: [pr(7), pr(8, { baseRefName: "dani/pr-7", labels: [{ name: "no-fusionar" }] })],
      hijos: { "dani/pr-7": [8] },
    });
    expect(numerosDe(resultado, "pr merge")).toEqual(["7"]);
    expect(llamadasA(resultado, "pr update-branch")).toEqual([]);
    expect(resultado.resumen).toContain("omitido #8: tiene la etiqueta no-fusionar");
  });
});

describeSiHayHerramientas("fusión programada: CI obligatorio, UNKNOWN y forks", () => {
  it("si falta el CI y la rama está detrás de main, la actualiza y fusiona", () => {
    const resultado = ejecutar({ prs: [pr(5, { statusCheckRollup: [] })], atras: { 5: 2 } });
    expect(numerosDe(resultado, "pr update-branch")).toEqual(["5"]);
    expect(numerosDe(resultado, "pr merge")).toEqual(["5"]);
  });

  it("si falta el CI y la rama está al día, no fusiona aunque Vercel esté en verde", () => {
    const resultado = ejecutar({ prs: [pr(5, { statusCheckRollup: [VERCEL] })] });
    expect(llamadasA(resultado, "pr merge")).toEqual([]);
    expect(resultado.resumen).toContain("omitido #5: le faltan comprobaciones obligatorias");
  });

  it("vuelve a preguntar mientras GitHub responde UNKNOWN", () => {
    const resultado = ejecutar({ prs: [pr(1)], listasSinCalcular: 2 });
    expect(numerosDe(resultado, "pr merge")).toEqual(["1"]);
  });

  it("si UNKNOWN no se resuelve, lo deja fuera con su motivo", () => {
    const resultado = ejecutar({ prs: [pr(1)], listasSinCalcular: 99 });
    expect(llamadasA(resultado, "pr merge")).toEqual([]);
    expect(resultado.resumen).toContain("omitido #1: no se puede fusionar (UNKNOWN)");
  });

  it("nunca fusiona ni actualiza un PR que viene de un fork", () => {
    const resultado = ejecutar({
      prs: [pr(4, { isCrossRepository: true, statusCheckRollup: [] })],
      atras: { 4: 3 },
    });
    expect(llamadasA(resultado, "pr merge")).toEqual([]);
    expect(llamadasA(resultado, "pr update-branch")).toEqual([]);
    expect(resultado.resumen).toContain("omitido #4: viene de un fork");
  });
});
