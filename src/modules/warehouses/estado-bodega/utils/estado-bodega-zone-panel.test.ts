import { describe, expect, it } from "vitest";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import {
  countPendingTasksForSection,
  filterTareasForSection,
} from "./estado-bodega-zone-panel";

const tarea = (
  overrides: Partial<TareaColaRow> & Pick<TareaColaRow, "tipo">,
): TareaColaRow => ({
  id_tarea: "t1",
  codigo_cuenta: "ACME",
  id_bodega: "b1",
  estado: "pendiente",
  id_asignado: null,
  id_orden_trabajo: null,
  id_solicitud_procesamiento: null,
  titulo: "Tarea",
  descripcion: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("estado-bodega-zone-panel", () => {
  it("agrupa tareas pendientes por zona", () => {
    const rows = [
      tarea({ id_tarea: "1", tipo: "ingreso" }),
      tarea({ id_tarea: "2", tipo: "despacho" }),
      tarea({ id_tarea: "3", tipo: "procesamiento", estado: "completada" }),
      tarea({ id_tarea: "4", tipo: "procesamiento" }),
    ];

    expect(filterTareasForSection(rows, "entrada")).toHaveLength(1);
    expect(countPendingTasksForSection(rows, "salida")).toBe(1);
    expect(countPendingTasksForSection(rows, "procesamiento")).toBe(0);
    expect(countPendingTasksForSection(rows, "almacenamiento")).toBe(1);
  });
});
