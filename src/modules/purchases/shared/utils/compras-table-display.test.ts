import { describe, expect, it } from "vitest";
import {
  resumirProductosTabla,
  tieneMasProductosTabla,
} from "./compras-table-display";

describe("compras-table-display", () => {
  it("resume hasta dos productos y agrega ellipsis", () => {
    expect(resumirProductosTabla(["A", "B"])).toBe("A · B");
    expect(resumirProductosTabla(["A", "B", "C"])).toBe("A · B…");
    expect(tieneMasProductosTabla(["A", "B", "C"])).toBe(true);
  });

  it("devuelve guión sin productos", () => {
    expect(resumirProductosTabla([])).toBe("—");
  });
});
