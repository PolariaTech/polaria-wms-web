import { describe, expect, it } from "vitest";
import {
  computeOvSla,
  formatOvElapsed,
  normalizeOvSlaConfig,
  ovAlertaCount,
} from "./ov-sla";

describe("ov-sla", () => {
  const config = normalizeOvSlaConfig(60, 45);
  const base = "2026-10-16T10:00:00.000Z";

  it("marca ok bajo el umbral de alerta", () => {
    const now = Date.parse(base) + 30 * 60_000;
    const result = computeOvSla("confirmada", base, config, now);
    expect(result).toMatchObject({
      slaStatus: "en_tiempo",
      alertaStatus: "ok",
      minutosEnEstado: 30,
    });
  });

  it("marca en riesgo entre alerta y SLA", () => {
    const now = Date.parse(base) + 50 * 60_000;
    const result = computeOvSla("alistamiento", base, config, now);
    expect(result).toMatchObject({
      slaStatus: "en_tiempo",
      alertaStatus: "en_riesgo",
      minutosEnEstado: 50,
    });
  });

  it("marca atrasada al superar el SLA", () => {
    const now = Date.parse(base) + 70 * 60_000;
    const result = computeOvSla("por_confirmar", base, config, now);
    expect(result).toMatchObject({
      slaStatus: "atrasada",
      alertaStatus: "atrasada",
      minutosEnEstado: 70,
    });
  });

  it("cierra SLA/alerta cuando la OV está alistada", () => {
    const now = Date.parse(base) + 120 * 60_000;
    const result = computeOvSla("alistada", base, config, now);
    expect(result.slaStatus).toBe("cerrada");
    expect(result.alertaStatus).toBe("cerrada");
  });

  it("formatea el tiempo en etapa", () => {
    expect(formatOvElapsed(38)).toBe("38 min");
    expect(formatOvElapsed(60)).toBe("1 h");
    expect(formatOvElapsed(68)).toBe("1 h 08 min");
    expect(formatOvElapsed(102)).toBe("1 h 42 min");
  });

  it("cuenta alertas por umbrales cruzados", () => {
    expect(ovAlertaCount("ok")).toBe(0);
    expect(ovAlertaCount("en_riesgo")).toBe(1);
    expect(ovAlertaCount("atrasada")).toBe(2);
    expect(ovAlertaCount("cerrada")).toBe(0);
  });
});
