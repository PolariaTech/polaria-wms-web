import { beforeEach, describe, expect, it, vi } from "vitest";

const runDomainQuery = vi.hoisted(() => vi.fn());
const runDomainMutation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/domain-query", () => ({
  runDomainQuery,
  runDomainMutation,
}));

import {
  acquireOvEditLock,
  heartbeatOvEditLock,
  peekOvEditLock,
  releaseOvEditLock,
} from "./ov-edit-lock.service";

describe("ov-edit-lock.service (REQ-180)", () => {
  beforeEach(() => {
    runDomainQuery.mockReset();
    runDomainMutation.mockReset();
  });

  it("peekOvEditLock mapea columnas snake_case", async () => {
    runDomainQuery.mockResolvedValue([
      {
        edit_locked_by: "u2",
        edit_locked_at: "2026-01-01T00:00:00.000Z",
        edit_locked_nombre: "Luis",
      },
    ]);
    await expect(
      peekOvEditLock({ codigoCuenta: "c1", idOrdenVenta: "ov1" }),
    ).resolves.toEqual({
      editLockedBy: "u2",
      editLockedAt: "2026-01-01T00:00:00.000Z",
      editLockedNombre: "Luis",
    });
  });

  it("acquireOvEditLock: extranjero activo → soloLectura sin update", async () => {
    const nowMs = Date.parse("2026-06-01T12:00:00.000Z");
    runDomainQuery.mockResolvedValue([
      {
        edit_locked_by: "u2",
        edit_locked_at: "2026-06-01T11:59:00.000Z",
        edit_locked_nombre: "Luis",
      },
    ]);
    const result = await acquireOvEditLock({
      codigoCuenta: "c1",
      idOrdenVenta: "ov1",
      idUsuario: "u1",
      nombreUsuario: "Ana",
      nowMs,
    });
    expect(result.mode).toBe("soloLectura");
    expect(result.holderNombre).toBe("Luis");
    expect(runDomainMutation).not.toHaveBeenCalled();
  });

  it("acquireOvEditLock: libre → toma lock", async () => {
    const nowMs = Date.parse("2026-06-01T12:00:00.000Z");
    runDomainQuery.mockResolvedValue([
      {
        edit_locked_by: null,
        edit_locked_at: null,
        edit_locked_nombre: null,
      },
    ]);
    runDomainMutation.mockResolvedValue([
      {
        edit_locked_by: "u1",
        edit_locked_at: "2026-06-01T12:00:00.000Z",
        edit_locked_nombre: "Ana",
      },
    ]);
    const result = await acquireOvEditLock({
      codigoCuenta: "c1",
      idOrdenVenta: "ov1",
      idUsuario: "u1",
      nombreUsuario: "Ana",
      nowMs,
    });
    expect(result.mode).toBe("edit");
    expect(runDomainMutation).toHaveBeenCalledOnce();
  });

  it("heartbeat y release delegan en mutation", async () => {
    runDomainMutation.mockResolvedValue([{ id_orden_venta: "ov1" }]);
    await expect(
      heartbeatOvEditLock({
        codigoCuenta: "c1",
        idOrdenVenta: "ov1",
        idUsuario: "u1",
      }),
    ).resolves.toBe(true);
    runDomainMutation.mockResolvedValue([]);
    await expect(
      releaseOvEditLock({
        codigoCuenta: "c1",
        idOrdenVenta: "ov1",
        idUsuario: "u1",
      }),
    ).resolves.toBeUndefined();
  });

  it("listOvEditLocks indexa por id", async () => {
    const { listOvEditLocks } = await import("./ov-edit-lock.service");
    runDomainQuery.mockResolvedValue([
      {
        id_orden_venta: "ov1",
        edit_locked_by: "u2",
        edit_locked_at: "t",
        edit_locked_nombre: "Luis",
      },
    ]);
    await expect(
      listOvEditLocks({ codigoCuenta: "c1", ids: ["ov1"] }),
    ).resolves.toEqual({
      ov1: {
        editLockedBy: "u2",
        editLockedAt: "t",
        editLockedNombre: "Luis",
      },
    });
  });
});
