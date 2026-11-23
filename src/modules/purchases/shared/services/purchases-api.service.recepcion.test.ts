import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { apiRequest } from "@/services/api/api";
import { cerrarRecepcionCompraApi } from "./purchases-api.service.recepcion";

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

const base = {
  idOrdenCompra: "oc-1",
  codigoCuenta: "CUENTA-01",
  idBodega: "bod-1",
  lineas: [{ idLineaOrdenCompra: "l-1", cantidadRecibida: 5 }],
};

describe("purchases-api.service.recepcion", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("rechaza orden, cuenta, bodega o líneas inválidas", async () => {
    await expect(
      cerrarRecepcionCompraApi({ ...base, idOrdenCompra: " " }),
    ).rejects.toBeInstanceOf(DomainServiceError);
    await expect(
      cerrarRecepcionCompraApi({ ...base, codigoCuenta: "" }),
    ).rejects.toBeInstanceOf(DomainServiceError);
    await expect(
      cerrarRecepcionCompraApi({ ...base, idBodega: "" }),
    ).rejects.toBeInstanceOf(DomainServiceError);
    await expect(
      cerrarRecepcionCompraApi({ ...base, lineas: [] }),
    ).rejects.toBeInstanceOf(DomainServiceError);
    await expect(
      cerrarRecepcionCompraApi({
        ...base,
        lineas: [{ idLineaOrdenCompra: "l-1", cantidadRecibida: -1 }],
      }),
    ).rejects.toBeInstanceOf(DomainServiceError);
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("envía la recepción con POST autenticado", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ idRecepcion: "r-1" });

    await cerrarRecepcionCompraApi(base);

    expect(apiRequest).toHaveBeenCalledTimes(1);
    const [path, options] = vi.mocked(apiRequest).mock.calls[0]!;
    expect(String(path)).toContain("/compras/");
    expect(options).toMatchObject({ method: "POST", auth: true });
  });
});
