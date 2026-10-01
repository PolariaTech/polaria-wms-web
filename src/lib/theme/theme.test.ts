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
});
