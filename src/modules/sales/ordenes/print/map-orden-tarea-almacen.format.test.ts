import { describe, expect, it } from "vitest";
import {
  formatOrdenTareaImpresaAt,
  formatOrdenTareaMetaLabel,
  formatOrdenTareaPageMeta,
  resolveOrdenTareaCreadaAt,
} from "./map-orden-tarea-almacen.format";

describe("formatOrdenTareaImpresaAt", () => {
  it("formatea en zona Cancún", () => {
    const text = formatOrdenTareaImpresaAt(new Date("2026-01-15T18:30:00Z"), "America/Cancun");
    expect(text).toMatch(/\d{2}-\w{3}-\d{4} \d{2}:\d{2}/);
  });
});

describe("resolveOrdenTareaCreadaAt", () => {
  it("prefiere createdAt", () => {
    const d = resolveOrdenTareaCreadaAt({ createdAt: "2026-01-01T12:00:00Z", fechaPedido: null });
    expect(d?.toISOString()).toBe("2026-01-01T12:00:00.000Z");
  });
});

describe("formatOrdenTareaPageMeta", () => {
  it("combina creada e impresa", () => {
    expect(formatOrdenTareaPageMeta({ creada: "A", impresa: "B" })).toContain("Creada A");
    expect(formatOrdenTareaPageMeta({ creada: "A", impresa: "B" })).toContain("Impresa B");
  });
});

describe("formatOrdenTareaMetaLabel", () => {
  it("muestra índice/total", () => {
    expect(formatOrdenTareaMetaLabel({ tareaIndex: 2, tareaTotal: 5 })).toBe("Orden de tarea 2/5");
  });
});