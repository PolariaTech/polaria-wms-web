import { describe, expect, it } from "vitest";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import {
  buildEstadoBodegaZonePanels,
  buildUbicacionesOrigenPendientesIds,
  collectDemoraAlertasOperativas,
  enrichTareasConOrden,
  resolveTareaSectionId,
} from "./estado-bodega-zone-operativo";

const tarea = (
  overrides: Partial<TareaColaRow> & Pick<TareaColaRow, "id_tarea">,
): TareaColaRow => ({
  codigo_cuenta: "ACME",
  id_bodega: "b1",
  tipo: "movimiento",
  estado: "pendiente",
  id_asignado: "op-1",
  id_orden_trabajo: "ord-1",
  id_solicitud_procesamiento: null,
  titulo: "A bodega · OT-000001",
  descripcion: null,
  created_at: "2026-07-09T12:00:00.000Z",
  updated_at: "2026-07-09T12:00:00.000Z",
  ...overrides,
});

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
