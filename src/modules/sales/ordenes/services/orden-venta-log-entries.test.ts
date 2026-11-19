import { describe, expect, it } from "vitest";
import type { OrdenVentaLogEntry } from "../types/orden-venta-log.types";
import {
  AUTOR_BITACORA_SISTEMA,
  buildCreacionSintetica,
  ensureCreacionEntry,
  filterLogEntriesForOt,
} from "./orden-venta-log-entries";

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

  it("no pisa la creación: reinyecta creacion de otra OT al filtrar", () => {
    const rows = [
      entry({
        id: "creacion-mateo",
        mensaje: "Esta orden de trabajo fue creada por ingestión Mateo / bot.",
        accion: "creacion",
        autor: "Mateo / bot",
        idOrdenTrabajo: "ot-vieja",
      }),
      entry({
        id: "edit-andres",
        mensaje: "Orden de trabajo editada por Andrés.",
        accion: "actualizacion",
        autor: "Andrés",
        idOrdenTrabajo: "ot-nueva",
      }),
    ];
    const next = filterLogEntriesForOt(rows, "ot-nueva");
    expect(next.map((r) => r.id)).toEqual(["edit-andres", "creacion-mateo"]);
    expect(next.find((r) => r.accion === "creacion")?.autor).toBe("Mateo / bot");
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

  it("sin autor explícito usa SISTEMA, nunca un editor posterior", () => {
    const rows = [
      entry({
        id: "1",
        mensaje: "Orden de trabajo editada por Andrés.",
        accion: "actualizacion",
        autor: "Andrés",
      }),
    ];
    const next = ensureCreacionEntry(rows, {
      createdAt: "2026-06-01T10:00:00.000Z",
      autorNombre: null,
    });
    expect(next[1]?.autor).toBe(AUTOR_BITACORA_SISTEMA);
    expect(next[1]?.mensaje).toContain(AUTOR_BITACORA_SISTEMA);
    expect(next[1]?.mensaje).not.toContain("Andrés");
  });

  it("no duplica si ya hay creación", () => {
    const rows = [entry({ id: "1", mensaje: "creada", accion: "creacion" })];
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

  it("sin autor nombra SISTEMA", () => {
    const row = buildCreacionSintetica({
      createdAt: "2026-06-28T15:30:00.000Z",
    });
    expect(row.autor).toBe(AUTOR_BITACORA_SISTEMA);
    expect(row.mensaje).toContain(`por ${AUTOR_BITACORA_SISTEMA}`);
  });
});
