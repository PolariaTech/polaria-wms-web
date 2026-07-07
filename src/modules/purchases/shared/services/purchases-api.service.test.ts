import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import {
  aprobarSolicitudCompraApi,
  cerrarRecepcionCompraApi,
  convertirSolicitudCompraAOrdenApi,
  createSolicitudCompraApi,
  emitirOrdenCompraApi,
  enviarSolicitudCompraAprobacionApi,
} from "./purchases-api.service";

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

describe("purchases-api.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("createSolicitudCompraApi publica solicitud con líneas", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      idSolicitudCompra: "sol-1",
      codigo: "SC-001",
      estado: "borrador",
      idProveedor: "prov-1",
      idBodega: "bod-1",
      idOrdenCompra: null,
    });

    const row = await createSolicitudCompraApi({
      codigoCuenta: "CUENTA-01",
      idBodega: "bod-1",
      lineas: [{ idProducto: "prod-1", cantidad: 10 }],
    });

    expect(apiRequest).toHaveBeenCalledWith("/compras/solicitudes", {
      method: "POST",
      auth: true,
      body: {
        codigoCuenta: "CUENTA-01",
        idBodega: "bod-1",
        observaciones: null,
        lineas: [{ idProducto: "prod-1", cantidad: 10 }],
      },
    });
    expect(row.codigo).toBe("SC-001");
  });

  it("createSolicitudCompraApi valida líneas", async () => {
    await expect(
      createSolicitudCompraApi({
        codigoCuenta: "CUENTA-01",
        idBodega: "bod-1",
        lineas: [],
      }),
    ).rejects.toBeInstanceOf(DomainServiceError);
  });

  it("enviarSolicitudCompraAprobacionApi llama endpoint de envío", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      idSolicitudCompra: "sol-1",
      codigo: "SC-001",
      estado: "pendiente_aprobacion",
      idProveedor: "prov-1",
      idBodega: "bod-1",
      idOrdenCompra: null,
    });

    await enviarSolicitudCompraAprobacionApi("sol-1");

    expect(apiRequest).toHaveBeenCalledWith(
      "/compras/solicitudes/sol-1/enviar-aprobacion",
      { method: "POST", auth: true, body: undefined },
    );
  });

  it("aprobarSolicitudCompraApi llama endpoint de aprobación", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      idSolicitudCompra: "sol-1",
      codigo: "SC-001",
      estado: "aprobada",
      idProveedor: "prov-1",
      idBodega: "bod-1",
      idOrdenCompra: null,
    });

    await aprobarSolicitudCompraApi("sol-1");

    expect(apiRequest).toHaveBeenCalledWith(
      "/compras/solicitudes/sol-1/aprobar",
      { method: "POST", auth: true, body: undefined },
    );
  });

  it("convertirSolicitudCompraAOrdenApi convierte a orden", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      idOrdenCompra: "oc-1",
      codigo: "OC-001",
      estado: "borrador",
      idProveedor: "prov-1",
      idBodega: "bod-1",
      idSolicitudCompra: "sol-1",
    });

    const row = await convertirSolicitudCompraAOrdenApi("sol-1");

    expect(apiRequest).toHaveBeenCalledWith(
      "/compras/solicitudes/sol-1/convertir-oc",
      { method: "POST", auth: true, body: undefined },
    );
    expect(row.idOrdenCompra).toBe("oc-1");
  });

  it("emitirOrdenCompraApi emite orden", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      idOrdenCompra: "oc-1",
      codigo: "OC-001",
      estado: "emitida",
      idProveedor: "prov-1",
      idBodega: "bod-1",
      idSolicitudCompra: "sol-1",
    });

    await emitirOrdenCompraApi("oc-1");

    expect(apiRequest).toHaveBeenCalledWith(
      "/compras/ordenes/oc-1/emitir",
      { method: "POST", auth: true, body: undefined },
    );
  });

  it("cerrarRecepcionCompraApi cierra recepción contra OC", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      idRecepcion: "rec-1",
      codigoCuenta: "CUENTA-01",
      idBodega: "bod-1",
      idOrdenCompra: "oc-1",
      sinDiferencias: true,
      notas: null,
      cerradaAt: "2026-07-05T12:00:00.000Z",
      estadoOrdenCompra: "recibida",
    });

    const row = await cerrarRecepcionCompraApi({
      idOrdenCompra: "oc-1",
      codigoCuenta: "CUENTA-01",
      idBodega: "bod-1",
      lineas: [
        {
          idLineaOrdenCompra: "linea-1",
          cantidadRecibida: 10,
          temperaturaRegistrada: -18,
        },
      ],
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/compras/recepciones/ordenes/oc-1/cerrar",
      {
        method: "POST",
        auth: true,
        body: {
          codigoCuenta: "CUENTA-01",
          idBodega: "bod-1",
          lineas: [
            {
              idLineaOrdenCompra: "linea-1",
              cantidadRecibida: 10,
              temperaturaRegistrada: -18,
            },
          ],
        },
      },
    );
    expect(row.idRecepcion).toBe("rec-1");
  });

  it("cerrarRecepcionCompraApi valida líneas", async () => {
    await expect(
      cerrarRecepcionCompraApi({
        idOrdenCompra: "oc-1",
        codigoCuenta: "CUENTA-01",
        idBodega: "bod-1",
        lineas: [],
      }),
    ).rejects.toBeInstanceOf(DomainServiceError);
  });

  it("propaga ApiError como DomainServiceError", async () => {
    vi.mocked(apiRequest).mockRejectedValue(
      new ApiError("No autorizado para esta empresa/cuenta", 403),
    );

    await expect(aprobarSolicitudCompraApi("sol-1")).rejects.toMatchObject({
      message: "No autorizado para esta empresa/cuenta",
      code: "MUTATION_FAILED",
    });
  });
});
