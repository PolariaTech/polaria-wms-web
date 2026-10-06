import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isPolariaTheme,
  POLARIA_THEME_DEFAULT,
  readStoredPolariaTheme,
} from "./theme";

describe("polaria theme", () => {
  it("por defecto es oscuro", () => {
    expect(POLARIA_THEME_DEFAULT).toBe("dark");
  });

  it("valida temas conocidos", () => {
    expect(isPolariaTheme("dark")).toBe(true);
    expect(isPolariaTheme("light")).toBe(true);
    expect(isPolariaTheme("system")).toBe(false);
  });

  it("sin storage vuelve a oscuro", () => {
    expect(readStoredPolariaTheme()).toBe("dark");
  });

  it("define --on-teal fijo en dark y light", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf8",
    );
    expect(css).toMatch(/html\[data-theme="dark"\][\s\S]*?--on-teal:\s*#020609/);
    expect(css).toMatch(/html\[data-theme="light"\][\s\S]*?--on-teal:\s*#020609/);
    expect(css).toContain("--color-polaria-on-teal: var(--on-teal)");
  });
});
