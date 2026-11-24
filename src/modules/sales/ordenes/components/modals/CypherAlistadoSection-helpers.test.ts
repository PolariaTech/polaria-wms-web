import { describe, expect, it } from "vitest";
import type { OrdenTrabajoHija } from "../../utils/origen/origen-correo-ordenes-trabajo";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import {
  buildCapturaByOtMap,
  buildFilasAlistado,
  buildResumenLineasAlistado,
  campoCaptura,
  resolveCerradoAtAlistado,
  resolveOtsAlistado,
  type CapturaApiRow,
} from "./CypherAlistadoSection-helpers";

function makeHija(overrides: Partial<OrdenTrabajoHija> = {}): OrdenTrabajoHija {
  return {
    id: "OT-1",
    label: "OT 1 — Cocina",
    numeroPedido: "OC-100",
    almacen: "Cocina",
    referenciaPedido: "",
    fecha: "",
    responsableExterno: "",
    renglones: [],
    totalCantidad: 0,
    ...overrides,
  };
}

describe("CypherAlistadoSection-helpers", () => {
  it("campoCaptura busca coincidencia directa y luego insensible a mayúsculas", () => {
    expect(campoCaptura(undefined, "despachoNombre")).toBe("");
    expect(
      campoCaptura({ despachoNombre: "  Juan Pérez  " }, "despachoNombre"),
    ).toBe("Juan Pérez");
    expect(
      campoCaptura({ "despachó nombre": "María López" }, "Despachó nombre"),
    ).toBe("María López");
    expect(campoCaptura({ otro: "x" }, "despachoNombre")).toBe("");
  });

  it("buildCapturaByOtMap indexa por id normalizado (trim) conservando la primera fila", () => {
    const capturas: CapturaApiRow[] = [
      { idOrdenTrabajo: " OT-1 ", updatedAt: "2026-01-02T10:00:00Z" },
      { idOrdenTrabajo: "OT-1", updatedAt: "2026-01-01T10:00:00Z" },
      { idOrdenTrabajo: "", updatedAt: "2026-01-03T10:00:00Z" },
    ];
    const map = buildCapturaByOtMap(capturas);
    expect(map.get("OT-1")?.updatedAt).toBe("2026-01-02T10:00:00Z");
    expect(map.get("")?.updatedAt).toBe("2026-01-03T10:00:00Z");
  });

  it("resolveOtsAlistado devuelve hijas si existen o crea fallback con centro_consumo", () => {
    const hija = makeHija();
    expect(
      resolveOtsAlistado([hija], {
        centro_consumo: "Banquetes",
        orden_compra_hotel: "OC-1",
      }),
    ).toEqual([hija]);

    const fallback = resolveOtsAlistado([], {
      centro_consumo: "Banquetes",
      orden_compra_hotel: "OC-200",
    });
    expect(fallback).toHaveLength(1);
    expect(fallback[0]).toMatchObject({
      id: "",
      label: "Banquetes",
      numeroPedido: "OC-200",
      almacen: "Banquetes",
    });
  });

  it("buildFilasAlistado arma destino, firma y fecha por OT con fallback a captura vacía", () => {
    const ots = [
      makeHija({ id: "OT-1", almacen: "Cocina Fría" }),
      makeHija({ id: "OT-2", almacen: "", label: "OT 2 — Bar Terraza" }),
    ];
    const capturas = buildCapturaByOtMap([
      {
        idOrdenTrabajo: "OT-1",
        updatedAt: "2026-05-01T12:00:00Z",
        payload: {
          campos: { despachoNombre: "Carlos Ruiz" },
          lineas: [],
        },
      },
      {
        idOrdenTrabajo: "",
        updatedAt: "2026-05-01T13:00:00Z",
        payload: {
          campos: { Despachó: "Ana Gómez" },
          lineas: [],
        },
      },
    ]);

    const filas = buildFilasAlistado(ots, capturas, "Av. Reforma 100");
    expect(filas).toEqual([
      {
        key: "OT-1",
        otLabel: "TAREA 1",
        destino: "Cocina Fría",
        despacho: "Carlos Ruiz",
        fecha: "2026-05-01T12:00:00Z",
      },
      {
        key: "OT-2",
        otLabel: "TAREA 2",
        destino: "Bar Terraza",
        despacho: "Ana Gómez",
        fecha: "2026-05-01T13:00:00Z",
      },
    ]);
  });

  it("resolveCerradoAtAlistado usa el timestamp más reciente o cae a fechas de la orden", () => {
    expect(
      resolveCerradoAtAlistado(
        [
          { updatedAt: "2026-05-01T10:00:00.000Z" },
          { updatedAt: "2026-05-01T15:30:00.000Z" },
          { updatedAt: "fecha-invalida" },
        ],
        { estado_desde: null, updated_at: null, created_at: null },
      ),
    ).toBe("2026-05-01T15:30:00.000Z");

    expect(
      resolveCerradoAtAlistado([], {
        estado_desde: "",
        updated_at: "2026-04-20T09:00:00Z",
        created_at: "2026-04-19T09:00:00Z",
      }),
    ).toBe("2026-04-20T09:00:00Z");
  });

  it("buildResumenLineasAlistado cuenta completas, parciales y no surtidas, y retorna null sin datos", () => {
    const ots = [makeHija({ id: "", renglones: [] })];
    const lineas = [
      { id_producto: "p1", nombre: "Tomate", cantidad_pedida: 10 },
      { id_producto: "p2", nombre: "Cebolla", cantidad_pedida: 5 },
      { id_producto: "p3", nombre: "Chile", cantidad_pedida: 2 },
    ] as unknown as OrdenVentaDetalleRow["lineas"];

    expect(buildResumenLineasAlistado(ots, new Map(), lineas)).toBeNull();

    const capturaMap = buildCapturaByOtMap([
      {
        idOrdenTrabajo: "",
        payload: {
          campos: {},
          lineas: [
            { indice: 1, cantidadPreparada: "10 kg" },
            { indice: 2, cantidadPreparada: "2.5" },
            { indice: 3, cantidadPreparada: "0" },
          ],
        },
      },
    ]);

    expect(buildResumenLineasAlistado(ots, capturaMap, lineas)).toEqual({
      completas: 1,
      parciales: 1,
      noSurtidas: 1,
      totalLineas: 3,
    });
  });
});
