import { describe, expect, it } from "vitest";
import vitestConfig from "../../vitest.config";

describe("vitest.config", () => {
  it("corre las pruebas en forks para que Node 22 no aborte la suite", () => {
    expect(vitestConfig.test?.pool).toBe("forks");
    expect(vitestConfig.test?.maxWorkers).toBe(2);
  });
});
