import { describe, expect, it } from "vitest";
import { toolbarButtonClassName } from "./inventario-mercancia-report.constants";

describe("inventario-mercancia-report.constants", () => {
  it("toolbarButtonClassName usa tokens del tema Polaria", () => {
    expect(toolbarButtonClassName).toContain("border-polaria-t-20");
    expect(toolbarButtonClassName).toContain("hover:text-polaria-teal");
  });
});
