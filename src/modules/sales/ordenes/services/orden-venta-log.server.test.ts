import { describe, expect, it } from "vitest";
import type { OrdenVentaLogEntry } from "../types/orden-venta-log.types";
import {
  buildCreacionSintetica,
  ensureCreacionEntry,
  filterLogEntriesForOt,
} from "./orden-venta-log.server";

function entry(
  partial: Partial<OrdenVentaLogEntry> & Pick<OrdenVentaLogEntry, "id" | "mensaje">,
): OrdenVentaLogEntry {
  return {
    createdAt: "2026-06-28T12:00:00.000Z",
    accion: "actualizacion",
    autor: null,
    idOrdenTrabajo: null,
    ...partial,
  };
}

describe("filterLogEntriesForOt", () => {
  it("sin filtro OT devuelve todos", () => {
    const rows = [
      entry({ id: "1", mensaje: "a", idOrdenTrabajo: "ot-a" }),
      entry({ id: "2", mensaje: "b", idOrdenTrabajo: null }),
    ];
    expect(filterLogEntriesForOt(rows)).toEqual(rows);
  });

  it("incluye eventos de la OT y los de toda la OV", () => {
    const rows = [
      entry({ id: "1", mensaje: "foto", idOrdenTrabajo: "ot-a" }),
      entry({ id: "2", mensaje: "creada", idOrdenTrabajo: null }),
      entry({ id: "3", mensaje: "otra", idOrdenTrabajo: "ot-b" }),
    ];
    expect(filterLogEntriesForOt(rows, "ot-a").map((r) => r.id)).toEqual([
      "1",
      "2",
    ]);
  });
});

describe("ensureCreacionEntry", () => {
  it("agrega creación sintética si no hay creacion", () => {
    const rows = [entry({ id: "1", mensaje: "editada", accion: "actualizacion" })];
    const next = ensureCreacionEntry(rows, {
      createdAt: "2026-06-01T10:00:00.000Z",
      autorNombre: "Ana",
    });
    expect(next).toHaveLength(2);
    expect(next[1]?.accion).toBe("sintetico");
    expect(next[1]?.mensaje).toContain("fue creada el");
    expect(next[1]?.mensaje).toContain("Ana");
  });

  it("no duplica si ya hay creación", () => {
    const rows = [
      entry({ id: "1", mensaje: "creada", accion: "creacion" }),
    ];
    expect(
      ensureCreacionEntry(rows, {
        createdAt: "2026-06-01T10:00:00.000Z",
      }),
    ).toEqual(rows);
  });
});

describe("buildCreacionSintetica", () => {
  it("arma mensaje con fecha y autor", () => {
    const row = buildCreacionSintetica({
      createdAt: "2026-06-28T15:30:00.000Z",
      autorNombre: "Luis",
    });
    expect(row.accion).toBe("sintetico");
    expect(row.mensaje).toMatch(/orden de trabajo fue creada el/i);
    expect(row.mensaje).toContain("Luis");
    expect(row.idOrdenTrabajo).toBeNull();
  });
});
