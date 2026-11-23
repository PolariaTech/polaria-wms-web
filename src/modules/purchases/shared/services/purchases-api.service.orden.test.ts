import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { apiRequest } from "@/services/api/api";
import {
  emitirOrdenCompraApi,
  listBodegasDestinoCompraApi,
} from "./purchases-api.service.orden";

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

describe("purchases-api.service.orden", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("emitirOrdenCompraApi hace POST a /emitir", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ idOrdenCompra: "oc-1" });

    await emitirOrdenCompraApi(" oc-1 ");

    expect(apiRequest).toHaveBeenCalledWith("/compras/ordenes/oc-1/emitir", {
      method: "POST",
      auth: true,
      body: undefined,
    });
  });

  it("emitirOrdenCompraApi rechaza id vacío", async () => {
    await expect(emitirOrdenCompraApi(" ")).rejects.toBeInstanceOf(
      DomainServiceError,
    );
  });

  it("listBodegasDestinoCompraApi arma query y normaliza no-arrays", async () => {
    vi.mocked(apiRequest).mockResolvedValue(null);

    const rows = await listBodegasDestinoCompraApi({
      codigoCuenta: " CUENTA-01 ",
      tipo: "interna",
    });

    expect(rows).toEqual([]);
    expect(apiRequest).toHaveBeenCalledWith(
      "/compras/bodegas-destino?codigoCuenta=CUENTA-01&tipo=interna",
      { method: "GET", auth: true, body: undefined },
    );
  });

  it("listBodegasDestinoCompraApi valida cuenta y tipo", async () => {
    await expect(
      listBodegasDestinoCompraApi({ codigoCuenta: " ", tipo: "interna" }),
    ).rejects.toBeInstanceOf(DomainServiceError);
    await expect(
      listBodegasDestinoCompraApi({
        codigoCuenta: "C",
        tipo: "otra" as unknown as "interna",
      }),
    ).rejects.toBeInstanceOf(DomainServiceError);
  });
});
