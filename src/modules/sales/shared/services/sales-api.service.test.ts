import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/api/api";

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

import { apiRequest } from "@/services/api/api";
import { emitirOrdenVentaApi, listOrdenesVentaApi } from "./sales-api.service";

describe("sales-api.service", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("emitirOrdenVentaApi llama POST /ventas/ordenes/:id/emitir", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      idOrdenVenta: "ov-1",
      venta: "OV-001",
      estado: "confirmada",
    });

    const row = await emitirOrdenVentaApi("ov-1");

    expect(apiRequest).toHaveBeenCalledWith("/ventas/ordenes/ov-1/emitir", {
      method: "POST",
      auth: true,
      body: undefined,
    });
    expect(row.estado).toBe("confirmada");
  });

  it("emitirOrdenVentaApi rechaza id vacío", async () => {
    await expect(emitirOrdenVentaApi("  ")).rejects.toThrow(
      "La orden de venta no es válida.",
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("emitirOrdenVentaApi propaga errores del API", async () => {
    vi.mocked(apiRequest).mockRejectedValue(
      new ApiError("Solo se pueden emitir ventas en borrador.", 409),
    );

    await expect(emitirOrdenVentaApi("ov-1")).rejects.toThrow(
      "Solo se pueden emitir ventas en borrador.",
    );
  });

  it("listOrdenesVentaApi usa paraSalida=true para el picker del jefe", async () => {
    vi.mocked(apiRequest).mockResolvedValue([
      {
        idOrdenVenta: "ov-1",
        venta: "OV-001",
        estado: "confirmada",
      },
    ]);

    const rows = await listOrdenesVentaApi({
      codigoCuenta: "ACME",
      idBodega: "b1",
      paraSalida: true,
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/ventas/ordenes?codigoCuenta=ACME&idBodega=b1&paraSalida=true",
      { auth: true },
    );
    expect(rows[0]?.estado).toBe("confirmada");
  });
});
