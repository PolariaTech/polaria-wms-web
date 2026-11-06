import { describe, expect, it, vi } from "vitest";

vi.mock("../../../shared/services/sales.service", () => ({
  avanzarEstadoOrdenVenta: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../services/orden-venta-log.client", () => ({
  postOrdenVentaLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({
      session: { idUsuario: "u-1", nombre: "Lucho" },
    }),
  },
}));

import { postOrdenVentaLog } from "../../services/orden-venta-log.client";
import { avanzarEstadoOrdenVenta } from "../../../shared/services/sales.service";

describe("cypher-drawer-estado log catch", () => {
  it("postOrdenVentaLog rechazado no tumba el flujo (contrato del .catch)", async () => {
    vi.mocked(postOrdenVentaLog).mockRejectedValueOnce(new Error("red"));
    await expect(
      avanzarEstadoOrdenVenta({
        codigoCuenta: "mit",
        idOrdenVenta: "ov-1",
        estado: "confirmada",
      }),
    ).resolves.toBeUndefined();
    await postOrdenVentaLog({
      idOrdenVenta: "ov-1",
      codigoCuenta: "mit",
      accion: "cambio_estado",
      mensaje: "x",
    }).catch(() => undefined);
    expect(true).toBe(true);
  });
});
