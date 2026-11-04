import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * REQ-104: los toasts flotan sobre la página. Un fondo translúcido (`--t08`, `--danger-bg`) deja ver
 * lo que hay detrás, así que cada toast debe llevar una base opaca (`--bg`) y el tinte encima como
 * `background-image`. jsdom no pinta CSS: esta prueba lee `globals.css` y cuida que no vuelva a
 * quedar un `background-color` translúcido en el toast ni en sus variantes.
 */
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** Declaraciones de la regla cuyo selector es exactamente `selector`. */
function regla(selector: string): string {
  const escapado = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const coincidencia = new RegExp(`(?:^|\\n)${escapado}\\s*\\{([^}]*)\\}`).exec(css);
  if (!coincidencia) throw new Error(`No encontré la regla ${selector} en globals.css`);
  return coincidencia[1] ?? "";
}

const VARIANTES = [".polaria-toast--success", ".polaria-toast--error", ".polaria-toast--info", ".polaria-toast--dark"];
const TRANSLUCIDOS = /background-color:\s*var\(--(?:t08|t20|danger-bg|warning-bg|w08)\)/;

describe("CSS de los toasts (REQ-104)", () => {
  it("la base lleva fondo opaco con el tinte encima como imagen", () => {
    const base = regla(".polaria-toast");

    expect(base).toMatch(/background-color:\s*var\(--bg\)/);
    expect(base).toMatch(/background-image:\s*linear-gradient\(var\(--t08\),\s*var\(--t08\)\)/);
  });

  it("el toast de error se tiñe de rojo sin perder la base opaca", () => {
    const error = regla(".polaria-toast--error");

    expect(error).toMatch(/background-image:\s*linear-gradient\(var\(--danger-bg\),\s*var\(--danger-bg\)\)/);
    expect(error).not.toMatch(/background-color/);
  });

  it.each(VARIANTES)("%s no vuelve a poner un fondo translúcido", (variante) => {
    expect(regla(variante)).not.toMatch(TRANSLUCIDOS);
  });
});
