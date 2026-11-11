import { beforeEach, describe, expect, it, vi } from "vitest";

const acquireOvEditLock = vi.hoisted(() => vi.fn());

vi.mock("../../services/ov-edit-lock.service", () => ({
  acquireOvEditLock,
}));

import { abrirEdicionOvConLock } from "./abrir-edicion-ov-con-lock";

describe("abrirEdicionOvConLock (REQ-180)", () => {
  beforeEach(() => {
    acquireOvEditLock.mockReset();
  });

  it("sin usuario abre en edición sin llamar al servicio", async () => {
    await expect(
      abrirEdicionOvConLock({
        codigoCuenta: "c1",
        idOrdenVenta: "ov1",
        idUsuario: null,
        nombreUsuario: null,
      }),
    ).resolves.toEqual({ soloLectura: false, holderNombre: null });
    expect(acquireOvEditLock).not.toHaveBeenCalled();
  });

  it("propaga soloLectura del acquire", async () => {
    acquireOvEditLock.mockResolvedValue({
      mode: "soloLectura",
      holderNombre: "Luis",
      holderId: "u2",
      snapshot: {
        editLockedBy: "u2",
        editLockedAt: "x",
        editLockedNombre: "Luis",
      },
    });
    await expect(
      abrirEdicionOvConLock({
        codigoCuenta: "c1",
        idOrdenVenta: "ov1",
        idUsuario: "u1",
        nombreUsuario: "Ana",
      }),
    ).resolves.toEqual({ soloLectura: true, holderNombre: "Luis" });
  });

  it("si el servicio falla, abre en edición", async () => {
    acquireOvEditLock.mockRejectedValue(new Error("columna inexistente"));
    await expect(
      abrirEdicionOvConLock({
        codigoCuenta: "c1",
        idOrdenVenta: "ov1",
        idUsuario: "u1",
        nombreUsuario: "Ana",
      }),
    ).resolves.toEqual({ soloLectura: false, holderNombre: null });
  });
});
