import { describe, expect, it } from "vitest";
import {
  CUENTA_ZONA_HORARIA_DEFAULT,
  CUENTA_ZONA_HORARIA_OPTIONS,
  isCuentaZonaHorariaId,
  resolveCuentaZonaHorariaId,
} from "./cuenta-zona-horaria";

describe("cuenta-zona-horaria", () => {
  it("tiene 6 opciones y default Cancún", () => {
    expect(CUENTA_ZONA_HORARIA_OPTIONS).toHaveLength(6);
    expect(CUENTA_ZONA_HORARIA_DEFAULT).toBe("America/Cancun");
  });

  it("resuelve ids válidos e inválidos", () => {
    expect(isCuentaZonaHorariaId("America/Cancun")).toBe(true);
    expect(isCuentaZonaHorariaId("Europe/Madrid")).toBe(false);
    expect(resolveCuentaZonaHorariaId("UTC")).toBe("UTC");
    expect(resolveCuentaZonaHorariaId("nope")).toBe("America/Cancun");
  });
});
