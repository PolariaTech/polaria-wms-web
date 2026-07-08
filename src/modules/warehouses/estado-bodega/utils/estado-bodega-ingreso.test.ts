import { describe, expect, it } from "vitest";
import type { UbicacionEstadoBodegaDbRow } from "../types/estado-bodega.types";
import {
  countUbicacionesEntrada,
  isUbicacionEntrada,
  resolveUbicacionIngresoDisponible,
} from "./estado-bodega-ingreso";

const entradaLibre: UbicacionEstadoBodegaDbRow = {
  id_ubicacion: "u-ing-1",
  codigo: "ING-01",
  estado_slot: "libre",
  tipo_ubicacion: {
    codigo: "INGRESO",
    es_recepcion: true,
    es_almacenamiento: false,
    es_picking: false,
  },
};

const entradaOcupada: UbicacionEstadoBodegaDbRow = {
  id_ubicacion: "u-ing-2",
  codigo: "ING-02",
  estado_slot: "ocupado",
  tipo_ubicacion: {
    codigo: "INGRESO",
    es_recepcion: true,
    es_almacenamiento: false,
    es_picking: false,
  },
};

const almacen: UbicacionEstadoBodegaDbRow = {
  id_ubicacion: "u-alm-1",
  codigo: "ALM-01",
  estado_slot: "libre",
  tipo_ubicacion: {
    codigo: "ALMACEN",
    es_recepcion: false,
    es_almacenamiento: true,
    es_picking: false,
  },
};

describe("estado-bodega-ingreso", () => {
  it("identifica ubicaciones de entrada", () => {
    expect(isUbicacionEntrada(entradaLibre)).toBe(true);
    expect(isUbicacionEntrada(almacen)).toBe(false);
  });

  it("elige el primer slot de ingreso libre", () => {
    const id = resolveUbicacionIngresoDisponible(
      [entradaOcupada, entradaLibre, almacen],
      [
        {
          id_warehouse_state: "ws-1",
          codigo_cuenta: "49M04",
          id_bodega: "b-1",
          id_ubicacion: "u-ing-2",
          id_producto: "p-1",
          id_lote: null,
          cantidad: "10",
          cantidad_reservada: "0",
          temperatura: null,
          locked_by: null,
          locked_at: null,
          version: 1,
          updated_at: "2026-07-07T00:00:00.000Z",
        },
      ],
    );

    expect(id).toBe("u-ing-1");
  });

  it("cuenta slots de ingreso configurados", () => {
    expect(
      countUbicacionesEntrada([entradaLibre, entradaOcupada, almacen]),
    ).toBe(2);
  });
});
