import { describe, expect, it } from "vitest";
import {
  buildEstadoBodegaZonePanels,
  buildUbicacionesOrigenPendientesIds,
  collectDemoraAlertasOperativas,
  enrichTareasConOrden,
  resolveTareaSectionId,
} from "./estado-bodega-zone-operativo";
import { tarea } from "./estado-bodega-zone-operativo.test-helpers";
describe("estado-bodega-zone-operativo", () => {
  it("deja una sola tarea OV en almacenamiento al registrar salida", () => {
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "prep",
  id_orden_trabajo: "ord-prep",
  id_asignado: null,
  titulo: "A salida · OT-000005",
  descripcion: "OV OV-20260709-160103 · Edgar Escobar",
  }),
  tarea({
  id_tarea: "salida",
  id_orden_trabajo: "ord-salida",
  id_asignado: "op-1",
  titulo: "A salida · OT-000006",
  descripcion: "OV OV-20260709-160103",
  }),
  ],
  [
  {
  idOrdenTrabajo: "ord-prep",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000005",
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
  {
  idOrdenTrabajo: "ord-salida",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000006",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_salida",
  idAsignado: "op-1",
  idOrdenVenta: "ov-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-a",
  idUbicacionDestino: "u-sal",
  observaciones: "OV OV-20260709-160103",
  createdAt: "2026-07-09T12:05:00.000Z",
  updatedAt: "2026-07-09T12:05:00.000Z",
  },
  ],
  new Map([
  ["u-a", "SLOT-001"],
  ["u-sal", "SAL-01"],
  ]),
  );

  const panels = buildEstadoBodegaZonePanels({
  alertasDb: [],
  tareas: enriched,
  stockIngreso: [],
  ingresoUbicacionIds: new Set(),
  salidaUbicacionIds: new Set(["u-sal"]),
  codigoByUbicacion: new Map([
  ["u-a", "SLOT-001"],
  ["u-sal", "SAL-01"],
  ]),
  });

  expect(panels.tareasBySection.almacenamiento.map((item) => item.id)).toEqual([
  "salida",
  ]);
  expect(panels.tareasBySection.almacenamiento[0]?.ovSalida).toBeUndefined();
  expect(panels.tareasBySection.salida).toHaveLength(0);
  });

  it("agrupa duplicados OV aunque solo una OT traiga idOrdenVenta", () => {
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "prep",
  id_orden_trabajo: "ord-prep",
  id_asignado: null,
  titulo: "A salida · OT-000005",
  descripcion: "OV OV-20260709-160103 · Edgar Escobar",
  }),
  tarea({
  id_tarea: "salida",
  id_orden_trabajo: "ord-salida",
  id_asignado: null,
  titulo: "A salida · OT-000006",
  descripcion: "OV OV-20260709-160103",
  }),
  ],
  [
  {
  idOrdenTrabajo: "ord-prep",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000005",
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
  {
  idOrdenTrabajo: "ord-salida",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000006",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_salida",
  idAsignado: "op-1",
  idOrdenVenta: null,
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-a",
  idUbicacionDestino: "u-sal",
  observaciones: "OV OV-20260709-160103",
  createdAt: "2026-07-09T12:05:00.000Z",
  updatedAt: "2026-07-09T12:05:00.000Z",
  },
  ],
  new Map([
  ["u-a", "SLOT-001"],
  ["u-sal", "SAL-01"],
  ]),
  );

  const panels = buildEstadoBodegaZonePanels({
  alertasDb: [],
  tareas: enriched,
  stockIngreso: [],
  ingresoUbicacionIds: new Set(),
  salidaUbicacionIds: new Set(["u-sal"]),
  codigoByUbicacion: new Map(),
  });

  expect(panels.tareasBySection.almacenamiento).toHaveLength(1);
  expect(panels.tareasBySection.almacenamiento[0]?.id).toBe("salida");
  expect(
  panels.tareasBySection.almacenamiento[0]?.subtitle ?? "",
  ).not.toContain("Sin operario asignado");
  });

  it("oculta tarea de preparación si la salida OV ya fue completada", () => {
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "prep",
  id_orden_trabajo: "ord-prep",
  titulo: "A salida · OT-000005",
  descripcion: "OV OV-20260709-160103 · Edgar Escobar",
  }),
  ],
  [
  {
  idOrdenTrabajo: "ord-prep",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000005",
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
  {
  idOrdenTrabajo: "ord-salida",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000006",
  estado: "completada",
  tipo: "orden",
  tipoFlujo: "a_salida",
  idAsignado: "op-1",
  idOrdenVenta: "ov-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-a",
  idUbicacionDestino: "u-sal",
  observaciones: "OV OV-20260709-160103",
  createdAt: "2026-07-09T12:05:00.000Z",
  updatedAt: "2026-07-09T12:10:00.000Z",
  },
  ],
  new Map(),
  );

  const panels = buildEstadoBodegaZonePanels({
  alertasDb: [],
  tareas: enriched,
  ordenes: [
  {
  idOrdenTrabajo: "ord-prep",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000005",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_salida",
  idAsignado: null,
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-a",
  idUbicacionDestino: null,
  idOrdenVenta: "ov-1",
  observaciones: "OV OV-20260709-160103",
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  },
  {
  idOrdenTrabajo: "ord-salida",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000006",
  estado: "completada",
  tipo: "orden",
  tipoFlujo: "a_salida",
  idAsignado: "op-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-a",
  idUbicacionDestino: "u-sal",
  idOrdenVenta: "ov-1",
  observaciones: "OV OV-20260709-160103",
  createdAt: "2026-07-09T12:05:00.000Z",
  updatedAt: "2026-07-09T12:10:00.000Z",
  },
  ],
  stockIngreso: [],
  ingresoUbicacionIds: new Set(),
  salidaUbicacionIds: new Set(["u-sal"]),
  codigoByUbicacion: new Map(),
  });

  expect(panels.tareasBySection.almacenamiento).toHaveLength(0);
  });
});