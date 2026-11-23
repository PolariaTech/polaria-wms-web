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
  it("expone borradores de demora para persistir en historial", () => {
  const now = Date.parse("2026-07-09T12:10:00.000Z");
  const enriched = enrichTareasConOrden(
  [
  tarea({
  id_tarea: "demorada",
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
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  },
  ],
  new Map([
  ["u-ing", "ING-01"],
  ["u-dest", "A-10"],
  ]),
  );

  const drafts = collectDemoraAlertasOperativas(
  enriched,
  {
  ingresoUbicacionIds: new Set(["u-ing"]),
  salidaUbicacionIds: new Set(),
  },
  now,
  );

  expect(drafts).toHaveLength(1);
  expect(drafts[0]?.idTarea).toBe("demorada");
  expect(drafts[0]?.sectionId).toBe("entrada");
  });
});