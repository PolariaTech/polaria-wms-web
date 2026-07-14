import { describe, expect, it, vi, beforeEach } from "vitest";
import { listTareasOperarioABodega } from "./operario-a-bodega.service";

const listTareasColaApi = vi.fn();
const listOrdenesTrabajoApi = vi.fn();
const listUbicacionesEstadoBodega = vi.fn();

vi.mock("@/modules/operations", () => ({
  listTareasColaApi: (...args: unknown[]) => listTareasColaApi(...args),
  listOrdenesTrabajoApi: (...args: unknown[]) => listOrdenesTrabajoApi(...args),
}));

vi.mock(
  "@/modules/warehouses/estado-bodega/services/estado-bodega.service",
  () => ({
    listUbicacionesEstadoBodega: (...args: unknown[]) =>
      listUbicacionesEstadoBodega(...args),
  }),
);

describe("listTareasOperarioABodega", () => {
  beforeEach(() => {
    listTareasColaApi.mockReset();
    listOrdenesTrabajoApi.mockReset();
    listUbicacionesEstadoBodega.mockReset();
  });

  it("retorna vacío sin tenant completo", async () => {
    await expect(
      listTareasOperarioABodega({
        codigoCuenta: null,
        idBodega: "bod-1",
        idUsuario: "usr-1",
      }),
    ).resolves.toEqual([]);
    expect(listTareasColaApi).not.toHaveBeenCalled();
  });

  it("enriquece tareas con orden y ubicaciones", async () => {
    listTareasColaApi.mockResolvedValue([
      {
        id_tarea: "t-1",
        codigo_cuenta: "CUENTA",
        id_bodega: "bod-1",
        tipo: "movimiento",
        estado: "pendiente",
        id_asignado: "usr-1",
        id_orden_trabajo: "ord-1",
        titulo: "A bodega · OT-000001",
        descripcion: null,
        created_at: "2026-07-01",
        updated_at: "2026-07-01",
      },
    ]);
    listOrdenesTrabajoApi.mockResolvedValue([
      {
        idOrdenTrabajo: "ord-1",
        codigoCuenta: "CUENTA",
        idBodega: "bod-1",
        codigo: "OT-000001",
        estado: "pendiente",
        tipo: "orden",
        tipoFlujo: "a_bodega",
        idAsignado: "usr-1",
        idSolicitante: null,
        idLote: null,
        idUbicacionOrigen: "u-ing",
        idUbicacionDestino: "u-dest",
        observaciones: null,
        createdAt: "2026-07-01",
        updatedAt: "2026-07-01",
      },
    ]);
    listUbicacionesEstadoBodega.mockResolvedValue([
      {
        id_ubicacion: "u-ing",
        codigo: "ING-02",
        estado_slot: "ocupado",
        tipo_ubicacion: { codigo: "ingreso", es_recepcion: true },
      },
      {
        id_ubicacion: "u-dest",
        codigo: "A-14",
        estado_slot: "libre",
        tipo_ubicacion: { codigo: "almacen", es_almacenamiento: true },
      },
    ]);

    const rows = await listTareasOperarioABodega({
      codigoCuenta: "CUENTA",
      idBodega: "bod-1",
      idUsuario: "usr-1",
    });

    expect(listTareasColaApi).toHaveBeenCalledWith({
      codigoCuenta: "CUENTA",
      idBodega: "bod-1",
      idAsignado: "usr-1",
      estado: "pendiente",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id_tarea: "t-1",
      tipoFlujo: "a_bodega",
      idUbicacionOrigen: "u-ing",
      origenCodigo: "ING-02",
      destinoCodigo: "A-14",
      ordenCodigo: "OT-000001",
    });
  });

  it("revisar duplica el slot en origen y destino", async () => {
    listTareasColaApi.mockResolvedValue([
      {
        id_tarea: "t-2",
        codigo_cuenta: "CUENTA",
        id_bodega: "bod-1",
        tipo: "revision",
        estado: "pendiente",
        id_asignado: "usr-1",
        id_orden_trabajo: "ord-2",
        titulo: "Revisar",
        descripcion: null,
        created_at: "2026-07-01",
        updated_at: "2026-07-01",
      },
    ]);
    listOrdenesTrabajoApi.mockResolvedValue([
      {
        idOrdenTrabajo: "ord-2",
        codigoCuenta: "CUENTA",
        idBodega: "bod-1",
        codigo: "OT-000002",
        estado: "pendiente",
        tipo: "orden",
        tipoFlujo: "revisar",
        idAsignado: "usr-1",
        idSolicitante: null,
        idLote: null,
        idUbicacionOrigen: null,
        idUbicacionDestino: "u-slot",
        observaciones: null,
        createdAt: "2026-07-01",
        updatedAt: "2026-07-01",
      },
    ]);
    listUbicacionesEstadoBodega.mockResolvedValue([
      {
        id_ubicacion: "u-slot",
        codigo: "D-11",
        estado_slot: "ocupado",
        tipo_ubicacion: { codigo: "almacen", es_almacenamiento: true },
      },
    ]);

    const rows = await listTareasOperarioABodega({
      codigoCuenta: "CUENTA",
      idBodega: "bod-1",
      idUsuario: "usr-1",
    });

    expect(rows[0]).toMatchObject({
      tipoFlujo: "revisar",
      origenCodigo: "D-11",
      destinoCodigo: "D-11",
    });
  });
});
