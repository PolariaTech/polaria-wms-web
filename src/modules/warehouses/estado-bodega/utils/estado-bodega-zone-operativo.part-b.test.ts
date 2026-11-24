import { describe, expect, it } from "vitest";
import { buildEstadoBodegaZonePanels, enrichTareasConOrden, resolveTareaSectionId } from "./estado-bodega-zone-operativo";
import { tarea } from "./estado-bodega-zone-operativo.test-helpers";
describe("estado-bodega-zone-operativo", () => {
  it("distribuye tareas de salida y almacenamiento en sus zonas", () => {
  const now = Date.parse("2026-07-09T12:02:00.000Z");
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "salida",
  id_orden_trabajo: "ord-s",
  created_at: "2026-07-09T12:00:00.000Z",
  }),
  tarea({
  id_tarea: "mov",
  id_orden_trabajo: "ord-m",
  created_at: "2026-07-09T12:00:00.000Z",
  }),
  ],
  [
  {
  idOrdenTrabajo: "ord-s",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-S",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_salida",
  idAsignado: "op-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-a",
  idUbicacionDestino: "u-s",
  observaciones: null,
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  },
  {
  idOrdenTrabajo: "ord-m",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-M",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "bodega_a_bodega",
  idAsignado: "op-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-1",
  idUbicacionDestino: "u-2",
  observaciones: null,
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  },
  ],
  new Map([
  ["u-a", "A-01"],
  ["u-s", "S-01"],
  ["u-1", "B-01"],
  ["u-2", "B-02"],
  ]),
  );

  const panels = buildEstadoBodegaZonePanels({
  alertasDb: [],
  tareas: enriched,
  stockIngreso: [],
  ingresoUbicacionIds: new Set(),
  salidaUbicacionIds: new Set(),
  codigoByUbicacion: new Map(),
  now,
  });

  expect(panels.tareasBySection.salida.map((item) => item.id)).toEqual(["salida"]);
  expect(panels.tareasBySection.almacenamiento.map((item) => item.id)).toEqual([
  "mov",
  ]);
  });

  it("incluye tareas pendientes sin operario asignado", () => {
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "ov-sin-asignar",
  id_orden_trabajo: "ord-ov",
  id_asignado: null,
  titulo: "Despacho venta OV-001",
  }),
  ],
  [
  {
  idOrdenTrabajo: "ord-ov",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-OV-001",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_salida",
  idAsignado: null,
  idOrdenVenta: "ov-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-a",
  idUbicacionDestino: null,
  observaciones: "OV OV-20260709-160103",
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  },
  ],
  new Map([
  ["u-a", "A-01"],
  ["u-s", "S-01"],
  ]),
  );

  const panels = buildEstadoBodegaZonePanels({
  alertasDb: [],
  tareas: enriched,
  stockIngreso: [],
  ingresoUbicacionIds: new Set(),
  salidaUbicacionIds: new Set(),
  codigoByUbicacion: new Map(),
  });

  expect(panels.tareasBySection.almacenamiento).toHaveLength(1);
  expect(panels.tareasBySection.almacenamiento[0]?.title).toBe(
  "Despacho venta OV-001",
  );
  expect(panels.tareasBySection.almacenamiento[0]?.subtitle).toContain(
  "Sin operario asignado",
  );
  expect(panels.tareasBySection.almacenamiento[0]?.ovSalida).toEqual({
  idOrdenVenta: "ov-1",
  ovCodigo: "OV-20260709-160103",
  idUbicacionOrigen: "u-a",
  });
  expect(panels.tareasBySection.salida).toHaveLength(0);
  });

  it("clasifica venta emitida en almacenamiento usando observaciones de la OT", () => {
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "ov-obs",
  id_orden_trabajo: "ord-ov",
  id_asignado: null,
  tipo: "despacho",
  titulo: "A-01 → S-01 · OT-001",
  }),
  ],
  [
  {
  idOrdenTrabajo: "ord-ov",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-001",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_salida",
  idAsignado: null,
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-a",
  idUbicacionDestino: null,
  observaciones: "OV OV-20260709-160103",
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  },
  ],
  new Map([
  ["u-a", "A-01"],
  ["u-s", "S-01"],
  ]),
  );

  const panels = buildEstadoBodegaZonePanels({
  alertasDb: [],
  tareas: enriched,
  stockIngreso: [],
  ingresoUbicacionIds: new Set(),
  salidaUbicacionIds: new Set(["u-s"]),
  codigoByUbicacion: new Map([
  ["u-a", "A-01"],
  ["u-s", "S-01"],
  ]),
  });

  expect(panels.tareasBySection.almacenamiento.map((item) => item.id)).toEqual([
  "ov-obs",
  ]);
  expect(panels.tareasBySection.salida).toHaveLength(0);
  });

  it("clasifica ingreso por ubicacion origen aunque falte tipoFlujo en la orden", () => {
  const enriched = enrichTareasConOrden(
  [tarea({ id_tarea: "ing", id_orden_trabajo: "ord-x" })],
  [
  {
  idOrdenTrabajo: "ord-x",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-X",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: null,
  idAsignado: "op-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-ing",
  idUbicacionDestino: "u-dest",
  observaciones: null,
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  },
  ],
  new Map([
  ["u-ing", "ING-01"],
  ["u-dest", "A-10"],
  ]),
  );

  const panels = buildEstadoBodegaZonePanels({
  alertasDb: [],
  tareas: enriched,
  stockIngreso: [],
  ingresoUbicacionIds: new Set(["u-ing"]),
  salidaUbicacionIds: new Set(),
  codigoByUbicacion: new Map([
  ["u-ing", "ING-01"],
  ["u-dest", "A-10"],
  ]),
  });

  expect(panels.tareasBySection.entrada.map((item) => item.id)).toEqual(["ing"]);
  });

  it("resuelve tarea de preparación OV en almacenamiento sin destino de salida", () => {
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "t-ov",
  id_orden_trabajo: "ord-ov",
  id_asignado: null,
  titulo: "Despacho venta OV-20260709-160103",
  }),
  ],
  [
  {
  idOrdenTrabajo: "ord-ov",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-001",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_salida",
  idAsignado: null,
  idOrdenVenta: "ov-99",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-a",
  idUbicacionDestino: null,
  observaciones: null,
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  },
  ],
  new Map(),
  )[0]!;

  expect(resolveTareaSectionId(enriched)).toBe("almacenamiento");
  expect(enriched.idUbicacionDestino).toBeNull();
  });
});