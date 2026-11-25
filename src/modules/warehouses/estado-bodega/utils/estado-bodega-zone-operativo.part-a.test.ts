import { describe, expect, it } from "vitest";
import { buildEstadoBodegaZonePanels, buildUbicacionesOrigenPendientesIds, enrichTareasConOrden, resolveTareaSectionId } from "./estado-bodega-zone-operativo";
import { tarea } from "./estado-bodega-zone-operativo.test-helpers";
describe("estado-bodega-zone-operativo", () => {
  it("agrupa ingreso a_bodega en zona entrada aunque tipo sea movimiento", () => {
  const enriched = enrichTareasConOrden(
  [tarea({ id_tarea: "t1" })],
  [
  {
  idOrdenTrabajo: "ord-1",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000001",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_bodega",
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

  expect(resolveTareaSectionId(enriched[0]!)).toBe("entrada");
  });

  it("bloquea ubicaciones origen con tarea pendiente de ingreso", () => {
  const ids = buildUbicacionesOrigenPendientesIds(
  [tarea({ id_tarea: "t1" })],
  [
  {
  idOrdenTrabajo: "ord-1",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000001",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_bodega",
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
  ["a_bodega"],
  );

  expect(ids.has("u-ing")).toBe(true);
  });

  it("bloquea ubicacion destino con tarea pendiente de revision", () => {
  const ids = buildUbicacionesOrigenPendientesIds(
  [tarea({ id_tarea: "t1" })],
  [
  {
  idOrdenTrabajo: "ord-1",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000001",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "revisar",
  idAsignado: "op-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: null,
  idUbicacionDestino: "u-slot",
  observaciones: null,
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  },
  ],
  ["revisar"],
  );

  expect(ids.has("u-slot")).toBe(true);
  });

  it("agrupa tareas por zona segun tipoFlujo", () => {
  const now = Date.parse("2026-07-09T12:10:00.000Z");
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "reciente",
  created_at: "2026-07-09T12:08:00.000Z",
  }),
  tarea({
  id_tarea: "demorada",
  id_orden_trabajo: "ord-2",
  created_at: "2026-07-09T12:00:00.000Z",
  }),
  ],
  [
  {
  idOrdenTrabajo: "ord-1",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000001",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_bodega",
  idAsignado: "op-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-ing",
  idUbicacionDestino: "u-dest",
  observaciones: null,
  createdAt: "2026-07-09T12:08:00.000Z",
  updatedAt: "2026-07-09T12:08:00.000Z",
  },
  {
  idOrdenTrabajo: "ord-2",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000002",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_bodega",
  idAsignado: "op-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-ing-2",
  idUbicacionDestino: "u-dest-2",
  observaciones: null,
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  },
  ],
  new Map([
  ["u-ing", "ING-01"],
  ["u-dest", "A-10"],
  ["u-ing-2", "ING-02"],
  ["u-dest-2", "A-11"],
  ]),
  );

  const panels = buildEstadoBodegaZonePanels({
  alertasDb: [],
  tareas: enriched,
  stockIngreso: [
  {
  id_warehouse_state: "ws-1",
  codigo_cuenta: "ACME",
  id_bodega: "b1",
  id_ubicacion: "u-ing",
  id_producto: "p1",
  id_lote: null,
  cantidad: "10",
  cantidad_reservada: "0",
  temperatura: "8",
  locked_by: null,
  locked_at: null,
  version: 1,
  updated_at: "2026-07-09T12:00:00.000Z",
  },
  ],
  ingresoUbicacionIds: new Set(["u-ing", "u-ing-2"]),
  salidaUbicacionIds: new Set(),
  codigoByUbicacion: new Map([
  ["u-ing", "ING-01"],
  ["u-ing-2", "ING-02"],
  ]),
  now,
  });

  expect(panels.alertasBySection.entrada.some((item) => item.id.startsWith("temp-"))).toBe(
  true,
  );
  });

  it("mueve tareas demoradas a alertas y deja tareas recientes en panel de tareas", () => {
  const now = Date.parse("2026-07-09T12:10:00.000Z");
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "reciente",
  created_at: "2026-07-09T12:08:00.000Z",
  }),
  tarea({
  id_tarea: "demorada",
  id_orden_trabajo: "ord-2",
  created_at: "2026-07-09T12:00:00.000Z",
  }),
  ],
  [
  {
  idOrdenTrabajo: "ord-1",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000001",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_bodega",
  idAsignado: "op-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-ing",
  idUbicacionDestino: "u-dest",
  observaciones: null,
  createdAt: "2026-07-09T12:08:00.000Z",
  updatedAt: "2026-07-09T12:08:00.000Z",
  },
  {
  idOrdenTrabajo: "ord-2",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000002",
  estado: "pendiente",
  tipo: "orden",
  tipoFlujo: "a_bodega",
  idAsignado: "op-1",
  idSolicitante: null,
  idLote: null,
  idUbicacionOrigen: "u-ing-2",
  idUbicacionDestino: "u-dest-2",
  observaciones: null,
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  },
  ],
  new Map([
  ["u-ing", "ING-01"],
  ["u-dest", "A-10"],
  ["u-ing-2", "ING-02"],
  ["u-dest-2", "A-11"],
  ]),
  );

  const panels = buildEstadoBodegaZonePanels({
  alertasDb: [],
  tareas: enriched,
  stockIngreso: [
  {
  id_warehouse_state: "ws-1",
  codigo_cuenta: "ACME",
  id_bodega: "b1",
  id_ubicacion: "u-ing",
  id_producto: "p1",
  id_lote: null,
  cantidad: "10",
  cantidad_reservada: "0",
  temperatura: "8",
  locked_by: null,
  locked_at: null,
  version: 1,
  updated_at: "2026-07-09T12:00:00.000Z",
  },
  ],
  ingresoUbicacionIds: new Set(["u-ing", "u-ing-2"]),
  salidaUbicacionIds: new Set(),
  codigoByUbicacion: new Map([
  ["u-ing", "ING-01"],
  ["u-ing-2", "ING-02"],
  ]),
  now,
  });

  expect(panels.tareasBySection.entrada).toHaveLength(2);
  expect(panels.tareasBySection.entrada.map((item) => item.id)).toEqual([
  "reciente",
  "demorada",
  ]);
  expect(panels.alertasBySection.entrada.some((item) => item.id.startsWith("demora-"))).toBe(
  true,
  );
  expect(panels.alertasBySection.entrada.some((item) => item.id.startsWith("temp-"))).toBe(
  true,
  );
  });
});