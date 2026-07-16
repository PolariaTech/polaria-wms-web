import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  apiRequest: vi.fn(),
}));

import { ApiError, apiRequest } from "@/services/api/api";
import { crearPaqueteDespachoApi } from "./transport-api.service";

describe("crearPaqueteDespachoApi", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("llama POST /transporte/paquetes-despacho", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      idViaje: "viaje-1",
      codigoViaje: "TV-0001",
      idCamion: "cam-1",
      placaCamion: "FME914",
      guias: [],
    });

    await crearPaqueteDespachoApi({
      codigoCuenta: "49M04",
      idBodega: "bod-1",
      idCamion: "cam-1",
      idOrdenesVenta: ["ov-1", "ov-1", "ov-2"],
    });

    expect(apiRequest).toHaveBeenCalledWith("/transporte/paquetes-despacho", {
      method: "POST",
      auth: true,
      body: {
        codigoCuenta: "49M04",
        idBodega: "bod-1",
        idCamion: "cam-1",
        idOrdenesVenta: ["ov-1", "ov-2"],
      },
    });
  });

  it("mapea ApiError a DomainServiceError", async () => {
    vi.mocked(apiRequest).mockRejectedValue(
      new ApiError("Camión no disponible", 409),
    );

    await expect(
      crearPaqueteDespachoApi({
        codigoCuenta: "49M04",
        idBodega: "bod-1",
        idCamion: "cam-1",
        idOrdenesVenta: ["ov-1"],
      }),
    ).rejects.toThrow("Camión no disponible");
  });
});
