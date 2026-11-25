import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { apiRequest } from "@/services/api/api";
import {
  aprobarSolicitudCompraApi,
  convertirSolicitudCompraAOrdenApi,
  enviarSolicitudCompraAprobacionApi,
} from "./purchases-api.service.solicitud";

vi.mock("@/services/api/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly code?: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
  apiRequest: vi.fn(),
}));

describe("purchases-api.service.solicitud", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
    vi.mocked(apiRequest).mockResolvedValue({});
  });

  it("enviarSolicitudCompraAprobacionApi envía idProveedor si existe", async () => {
    await enviarSolicitudCompraAprobacionApi(" sol-1 ", { idProveedor: " p-1 " });

    expect(apiRequest).toHaveBeenCalledWith(
      "/compras/solicitudes/sol-1/enviar-aprobacion",
      { method: "POST", auth: true, body: { idProveedor: "p-1" } },
    );
  });

  it("enviarSolicitudCompraAprobacionApi envía body vacío sin proveedor", async () => {
    await enviarSolicitudCompraAprobacionApi("sol-1");

    expect(apiRequest).toHaveBeenCalledWith(
      "/compras/solicitudes/sol-1/enviar-aprobacion",
      { method: "POST", auth: true, body: {} },
    );
  });

  it("aprobar y convertir usan sus rutas", async () => {
    await aprobarSolicitudCompraApi("sol-2");
    await convertirSolicitudCompraAOrdenApi("sol-2");

    expect(vi.mocked(apiRequest).mock.calls.map((call) => call[0])).toEqual([
      "/compras/solicitudes/sol-2/aprobar",
      "/compras/solicitudes/sol-2/convertir-oc",
    ]);
  });

  it("rechaza ids vacíos", async () => {
    await expect(aprobarSolicitudCompraApi("  ")).rejects.toBeInstanceOf(
      DomainServiceError,
    );
    await expect(convertirSolicitudCompraAOrdenApi("")).rejects.toBeInstanceOf(
      DomainServiceError,
    );
    await expect(enviarSolicitudCompraAprobacionApi("")).rejects.toBeInstanceOf(
      DomainServiceError,
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });
});
