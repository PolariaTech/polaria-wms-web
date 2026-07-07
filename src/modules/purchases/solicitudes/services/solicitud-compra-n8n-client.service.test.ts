import { describe, expect, it, vi } from "vitest";
import {
  buildSolicitudCompraN8nBody,
  notifySolicitudCompraN8n,
} from "./solicitud-compra-n8n-client.service";

describe("solicitud-compra-n8n-client.service", () => {
  it("buildSolicitudCompraN8nBody arma payload snake_case para n8n", () => {
    expect(
      buildSolicitudCompraN8nBody({
        codigoCuenta: "49M04",
        solicitud: {
          idSolicitudCompra: "sol-1",
          codigo: "60ERA",
          estado: "borrador",
          idProveedor: "88522d67-4de0-428e-8bec-bf2581916df0",
          idBodega: "bod-1",
          idOrdenCompra: null,
        },
        proveedor: {
          idProveedor: "88522d67-4de0-428e-8bec-bf2581916df0",
          proveedor: "Pat-lafrieda",
          nombre: "Pat-lafrieda",
          telefono: "+573017447947",
        },
        lineas: [
          {
            idProducto: "5dbb31df-e070-407e-bb05-d7714afd0a98",
            sku: "OH2WF",
            descripcion: "Frozen-Lamb Racks",
            cantidad: 300,
          },
        ],
      }),
    ).toEqual({
      codigo_cuenta: "49M04",
      telefono: "+573017447947",
      id_proveedor: "88522d67-4de0-428e-8bec-bf2581916df0",
      razon_social: "Pat-lafrieda",
      codigo: "60ERA",
      estado: "Iniciado",
      solicitud_compra_linea: [
        {
          id_producto: "5dbb31df-e070-407e-bb05-d7714afd0a98",
          sku: "OH2WF",
          descripcion: "Frozen-Lamb Racks",
          cantidad: 300,
        },
      ],
      mensaje_final: "Hola, solicito cotización de los productos detallados.",
    });
  });

  it("notifySolicitudCompraN8n llama POST /api/solicitud-compra", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          n8nStatus: 200,
          correlationId: "corr-1",
        }),
      }),
    );

    const body = buildSolicitudCompraN8nBody({
      codigoCuenta: "49M04",
      solicitud: {
        idSolicitudCompra: "sol-1",
        codigo: "60ERA",
        estado: "borrador",
        idProveedor: "88522d67-4de0-428e-8bec-bf2581916df0",
        idBodega: "bod-1",
        idOrdenCompra: null,
      },
      proveedor: {
        idProveedor: "88522d67-4de0-428e-8bec-bf2581916df0",
        proveedor: "Pat-lafrieda",
        nombre: "Pat-lafrieda",
        telefono: "+573017447947",
      },
      lineas: [
        {
          idProducto: "5dbb31df-e070-407e-bb05-d7714afd0a98",
          sku: "OH2WF",
          descripcion: "Frozen-Lamb Racks",
          cantidad: 300,
        },
      ],
    });

    const result = await notifySolicitudCompraN8n(body);

    expect(fetch).toHaveBeenCalledWith("/api/solicitud-compra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(result.correlationId).toBe("corr-1");
  });
});
