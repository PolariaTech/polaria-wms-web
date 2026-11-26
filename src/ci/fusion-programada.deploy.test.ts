/**
 * Despliegue a AWS al final de la fusión programada: una sola vez, después de la última fusión y solo si se
 * fusionó algo.
 */
import { afterAll, describe, expect, it } from "vitest";

import {
  ejecutar,
  hayHerramientas,
  limpiarEscenarios,
  llamadasA,
  pr,
  REPO,
  Resultado,
  SHA_MAIN,
  URL_DEPLOY,
} from "./__tests__/fusion-programada.arnes";

const lanzar = `api --method POST repos/${REPO}/actions/workflows/deploy.yml/dispatches -f ref=main -f inputs[ref]=${SHA_MAIN} -F return_run_details=true --jq .html_url`;

const lanzamientos = (resultado: Resultado): string[] => llamadasA(resultado, "api --method POST");

describe.skipIf(!hayHerramientas)("fusion-programada.yml: despliegue a AWS", () => {
  afterAll(limpiarEscenarios);

  it("lanza un solo Deploy, después de la última fusión, con el commit de main", () => {
    const resultado = ejecutar({ prs: [pr(1), pr(2)] });

    expect(resultado.codigo).toBe(0);
    expect(lanzamientos(resultado)).toEqual([lanzar]);
    expect(resultado.llamadas[resultado.llamadas.length - 1]).toBe(lanzar);
    expect(resultado.resumen).toContain(`Deploy a AWS lanzado con el commit ${SHA_MAIN.slice(0, 7)}: ${URL_DEPLOY}`);
  });

  it("no despliega si no hay ningún PR listo", () => {
    const resultado = ejecutar({ prs: [pr(1, { isDraft: true })] });

    expect(resultado.codigo).toBe(0);
    expect(llamadasA(resultado, "api")).toEqual([]);
  });

  it("no despliega si ninguna fusión salió bien", () => {
    const resultado = ejecutar({ prs: [pr(1)], fallan: ["fusionar-1"] });

    expect(resultado.codigo).toBe(1);
    expect(llamadasA(resultado, "api")).toEqual([]);
  });

  it("despliega lo fusionado aunque otro PR haya fallado", () => {
    const resultado = ejecutar({ prs: [pr(1), pr(2)], fallan: ["fusionar-1"] });

    expect(resultado.codigo).toBe(1);
    expect(lanzamientos(resultado)).toEqual([lanzar]);
  });
});

describe.skipIf(!hayHerramientas)("fusion-programada.yml: simulación y fallos del despliegue a AWS", () => {
  afterAll(limpiarEscenarios);

  it("en simulación no despliega y lo dice en el resumen", () => {
    const resultado = ejecutar({ prs: [pr(1)], soloSimular: true });

    expect(resultado.codigo).toBe(0);
    expect(llamadasA(resultado, "api")).toEqual([]);
    expect(resultado.resumen).toContain("(simulación) al terminar lanzaría el Deploy a AWS");
  });

  it.each(["sha-main", "lanzar-deploy"])("termina en rojo si falla %s", (marcador) => {
    const resultado = ejecutar({ prs: [pr(1)], fallan: [marcador] });

    expect(resultado.codigo).toBe(1);
    expect(resultado.resumen).toContain("NO se pudo lanzar el Deploy a AWS");
    expect(resultado.resumen).toContain("Fallos reales: 1");
    expect(lanzamientos(resultado)).toHaveLength(marcador === "sha-main" ? 0 : 1);
  });
});
