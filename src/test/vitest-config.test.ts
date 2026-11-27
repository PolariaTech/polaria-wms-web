import { describe, expect, it } from "vitest";
import vitestConfig from "../../vitest.config";

describe("vitest.config", () => {
  it("corre las pruebas con threads, que miden menos tiempo que forks", () => {
    expect(vitestConfig.test?.pool).toBe("threads");
  });

  it("falla el proceso si no hay tests ejecutables (CI no en verde por error)", () => {
    expect(vitestConfig.test?.passWithNoTests).toBe(false);
  });

  it("excluye scripts/ para no romper Vitest/Rolldown con shebangs de .mjs", () => {
    expect(vitestConfig.test?.exclude).toContain("scripts/**");
  });
});
