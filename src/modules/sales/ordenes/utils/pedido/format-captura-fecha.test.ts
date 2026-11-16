import { describe, expect, it } from "vitest";
import { formatCapturaFecha } from "./format-captura-fecha";

describe("formatCapturaFecha (REQ-320/321)", () => {
  it("formatea ISO como DD-MMM-AAAA (DÍA)", () => {
    expect(formatCapturaFecha("2026-09-03")).toBe("03-SEP-2026 (JUEVES)");
    expect(formatCapturaFecha("2026-11-17")).toBe("17-NOV-2026 (MARTES)");
  });

  it("acepta slash US o LatAm", () => {
    expect(formatCapturaFecha("10/24/2026")).toBe("24-OCT-2026 (SÁBADO)");
    expect(formatCapturaFecha("24/10/2026")).toBe("24-OCT-2026 (SÁBADO)");
  });

  it("vacío o ilegible", () => {
    expect(formatCapturaFecha("")).toBe("");
    expect(formatCapturaFecha("no-fecha")).toBe("no-fecha");
  });
});
