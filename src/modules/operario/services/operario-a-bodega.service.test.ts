import { describe, expect, it, vi, beforeEach } from "vitest";
import { listTareasOperarioABodega } from "./operario-a-bodega.service";

const listTareasCola = vi.fn();

vi.mock("@/modules/processing", () => ({
  listTareasCola: (...args: unknown[]) => listTareasCola(...args),
}));

describe("listTareasOperarioABodega", () => {
  beforeEach(() => {
    listTareasCola.mockReset();
  });

  it("retorna vacío sin tenant completo", async () => {
    await expect(
      listTareasOperarioABodega({
        codigoCuenta: null,
        idBodega: "bod-1",
        idUsuario: "usr-1",
      }),
    ).resolves.toEqual([]);
    expect(listTareasCola).not.toHaveBeenCalled();
  });

  it("filtra movimientos pendientes asignados al operario", async () => {
    listTareasCola.mockResolvedValue([
      {
        id_tarea: "t-1",
        codigo_cuenta: "CUENTA",
        id_bodega: "bod-1",
        tipo: "movimiento",
        estado: "pendiente",
        id_asignado: "usr-1",
        id_orden_trabajo: null,
        titulo: "Traslado casillero 3",
        descripcion: null,
        created_at: "2026-07-01",
        updated_at: "2026-07-01",
      },
      {
        id_tarea: "t-2",
        codigo_cuenta: "CUENTA",
        id_bodega: "bod-1",
        tipo: "ingreso",
        estado: "pendiente",
        id_asignado: "usr-1",
        id_orden_trabajo: null,
        titulo: "Ingreso",
        descripcion: null,
        created_at: "2026-07-01",
        updated_at: "2026-07-01",
      },
      {
        id_tarea: "t-3",
        codigo_cuenta: "CUENTA",
        id_bodega: "bod-1",
        tipo: "movimiento",
        estado: "pendiente",
        id_asignado: "usr-2",
        id_orden_trabajo: null,
        titulo: "Otro operario",
        descripcion: null,
        created_at: "2026-07-01",
        updated_at: "2026-07-01",
      },
    ]);

    const rows = await listTareasOperarioABodega({
      codigoCuenta: "CUENTA",
      idBodega: "bod-1",
      idUsuario: "usr-1",
    });

    expect(listTareasCola).toHaveBeenCalledWith({
      codigoCuenta: "CUENTA",
      idBodega: "bod-1",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id_tarea).toBe("t-1");
  });
});
