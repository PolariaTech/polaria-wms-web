import { describe, expect, it } from "vitest";
import {
  extractLogSlaCallout,
  resolveLogEntryAutorBadge,
  resolveLogEntryTone,
} from "./log-entry-tone";

describe("resolveLogEntryTone", () => {
  it("marca creación", () => {
    expect(
      resolveLogEntryTone({
        accion: "creacion",
        mensaje: "Orden creada · Por confirmar",
        autor: null,
      }),
    ).toBe("crear");
  });

  it("marca progreso en confirmación / Mateo", () => {
    expect(
      resolveLogEntryTone({
        accion: "cambio_estado",
        mensaje: "pasa a Confirmada",
        autor: "Andrés",
      }),
    ).toBe("progreso");
    expect(
      resolveLogEntryTone({
        accion: "actualizacion",
        mensaje: "Mateo propuso valores",
        autor: "Mateo",
      }),
    ).toBe("progreso");
  });

  it("marca operación en impresión y escaneo", () => {
    expect(
      resolveLogEntryTone({
        accion: "actualizacion",
        mensaje: "Hoja de OT 1 impresa",
        autor: "Sistema",
      }),
    ).toBe("operacion");
    expect(
      resolveLogEntryTone({
        accion: "actualizacion",
        mensaje: "OT 1 escaneada · Bodega Chía",
        autor: "Ana",
      }),
    ).toBe("operacion");
  });

  it("marca alerta en fallos y SLA excedido", () => {
    expect(
      resolveLogEntryTone({
        accion: "actualizacion",
        mensaje: "falló la impresión automática",
        autor: "Sistema",
      }),
    ).toBe("alerta");
    expect(
      resolveLogEntryTone({
        accion: "cambio_estado",
        mensaje: "Confirmada: 1 h 12 min · límite 60 min",
        autor: "Sistema",
      }),
    ).toBe("alerta");
  });

  it("marca aviso en SLA dentro de límite", () => {
    expect(
      resolveLogEntryTone({
        accion: "cambio_estado",
        mensaje: "Por confirmar: 52 min · límite 60 min",
        autor: "Sistema",
      }),
    ).toBe("aviso");
  });
});

describe("extractLogSlaCallout", () => {
  it("extrae callout y detecta over-limit", () => {
    const ok = extractLogSlaCallout("Por confirmar: 52 min · límite 60 min");
    expect(ok?.overLimit).toBe(false);
    const bad = extractLogSlaCallout("Confirmada: 1 h 12 min · límite 60 min");
    expect(bad?.overLimit).toBe(true);
  });
});

describe("resolveLogEntryAutorBadge", () => {
  it("prioriza autor y cae a Sistema/Mateo", () => {
    expect(
      resolveLogEntryAutorBadge({ autor: "Ana", mensaje: "x" }),
    ).toBe("Ana");
    expect(
      resolveLogEntryAutorBadge({
        autor: null,
        mensaje: "Mateo propuso valores",
      }),
    ).toBe("Mateo");
    expect(
      resolveLogEntryAutorBadge({ autor: null, mensaje: "Orden creada" }),
    ).toBe("Sistema");
  });
});
