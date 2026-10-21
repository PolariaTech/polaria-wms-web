import { describe, expect, it } from "vitest";
import {
  computeOvSla,
  formatOvElapsed,
  normalizeOvSlaConfig,
  ovAlertaCount,
  tooltipOvAlertaDot,
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

  it("arma tooltips del punto SLA por tono", () => {
    expect(
      tooltipOvAlertaDot({
        alertaStatus: "atrasada",
        minutosEnEstado: 158,
        slaMinutos: 120,
        alertaMinutos: 90,
      }),
    ).toBe("Sin avanzar hace 2 h 38 min · límite 2 h");

    expect(
      tooltipOvAlertaDot({
        alertaStatus: "en_riesgo",
        minutosEnEstado: 50,
        slaMinutos: 60,
        alertaMinutos: 45,
      }),
    ).toBe("En riesgo · sin avanzar hace 50 min · alerta a 45 min");

    expect(
      tooltipOvAlertaDot({
        alertaStatus: "ok",
        minutosEnEstado: 20,
        slaMinutos: 60,
        alertaMinutos: 45,
      }),
    ).toBe("En tiempo · 20 min en esta etapa · límite 1 h");

    expect(
      tooltipOvAlertaDot({
        alertaStatus: "cerrada",
        minutosEnEstado: 200,
        slaMinutos: 60,
        alertaMinutos: 45,
      }),
    ).toBe("Completada · sin seguimiento de tiempo");
  });
});
