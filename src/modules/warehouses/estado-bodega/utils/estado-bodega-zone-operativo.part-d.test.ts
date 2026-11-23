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
  it("oculta preparación OV si la salida está en estado ejecutada", () => {
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
  estado: "ejecutada",
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
  estado: "ejecutada",
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
  stock: [],
  stockIngreso: [],
  ingresoUbicacionIds: new Set(),
  salidaUbicacionIds: new Set(["u-sal"]),
  codigoByUbicacion: new Map(),
  });

  expect(panels.tareasBySection.almacenamiento).toHaveLength(0);
  });

  it("oculta tarea OV con salida registrada si la OT ya fue completada", () => {
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "salida-ov",
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
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:10:00.000Z",
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
  ordenes: [
  {
  idOrdenTrabajo: "ord-prep",
  codigoCuenta: "ACME",
  idBodega: "b1",
  codigo: "OT-000005",
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
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:10:00.000Z",
  },
  ],
  stock: [],
  almacenUbicacionIds: new Set(["u-a"]),
  stockIngreso: [],
  ingresoUbicacionIds: new Set(),
  salidaUbicacionIds: new Set(["u-sal"]),
  codigoByUbicacion: new Map(),
  });

  expect(panels.tareasBySection.almacenamiento).toHaveLength(0);
  expect(
  panels.alertasBySection.almacenamiento.some((item) =>
  item.id.startsWith("demora-"),
  ),
  ).toBe(false);
  });

  it("oculta preparación OV si el slot origen ya no tiene stock", () => {
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
  ],
  new Map(),
  );

  const panels = buildEstadoBodegaZonePanels({
  alertasDb: [],
  tareas: enriched,
  ordenes: [],
  stock: [
  {
  id_warehouse_state: "ws-sal",
  codigo_cuenta: "ACME",
  id_bodega: "b1",
  id_ubicacion: "u-sal",
  id_producto: "p1",
  id_lote: null,
  cantidad: "10",
  cantidad_reservada: "0",
  temperatura: null,
  locked_by: null,
  locked_at: null,
  version: 1,
  updated_at: "2026-07-09T12:00:00.000Z",
  },
  ],
  almacenUbicacionIds: new Set(["u-a"]),
  stockIngreso: [],
  ingresoUbicacionIds: new Set(),
  salidaUbicacionIds: new Set(),
  codigoByUbicacion: new Map(),
  });

  expect(panels.tareasBySection.almacenamiento).toHaveLength(0);
  });

  it("muestra tarea asignada desde la orden aunque id_asignado venga vacio en tarea", () => {
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "ing",
  id_asignado: null,
  id_orden_trabajo: "ord-1",
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
  codigoByUbicacion: new Map(),
  });

  expect(panels.tareasBySection.entrada).toHaveLength(1);
  });
});