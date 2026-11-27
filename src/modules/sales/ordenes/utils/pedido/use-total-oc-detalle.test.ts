import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ocsDeLaOrden, useTotalOcDetalle } from "./use-total-oc-detalle";

const ADJUNTOS = JSON.stringify([
  { nombre: "correo.eml", path: "c/correo.eml", mime: "message/rfc822" },
]);

describe("ocsDeLaOrden", () => {
  it("cabecera más las OC de las tareas, sin repetir", () => {
    expect(
      ocsDeLaOrden({
        orden_compra_hotel: "4503007927",
        origen_correo: [
          { Producto: "PAPA", "Numero pedido": "4503007927" },
          { Producto: "PERA", "Numero pedido": "4503007999" },
        ],
      }),
    ).toEqual(["4503007927", "4503007999"]);
  });
});

describe("useTotalOcDetalle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa el total del cuerpo sin leer adjuntos", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useTotalOcDetalle({ origen_texto: "Pedido\nTotal pedido: MXN 1,500.00", origen_archivos: ADJUNTOS }),
    );

    expect(result.current).toBe(1500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("REQ-425: sin total en el cuerpo, toma el del PDF de la OC de esta OV", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          totalSolicitud: 27325.35,
          totalesPorOc: { "4503007904": 27325.35, "4503007927": 22671.75 },
        }),
      }),
    );

    const { result } = renderHook(() =>
      useTotalOcDetalle({
        origen_texto: "Buen día, confirmo orden de compra",
        origen_archivos: ADJUNTOS,
        orden_compra_hotel: "4503007927",
      }),
    );

    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe(22671.75));
  });

  it("sin adjuntos ni total en el cuerpo no hay total", () => {
    const { result } = renderHook(() => useTotalOcDetalle({ origen_texto: "hola" }));

    expect(result.current).toBeNull();
  });
});
