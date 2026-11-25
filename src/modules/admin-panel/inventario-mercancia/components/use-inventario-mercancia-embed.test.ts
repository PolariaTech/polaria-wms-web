import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({
  getBodegaExternaEmbedEligible: vi.fn(),
  listBodegaExternaEmbedReports: vi.fn(),
  mintBodegaExternaEmbedViewUrl: vi.fn(),
}));

vi.mock("../services/cuenta-reporte-embed.client", () => client);

import { useInventarioMercanciaEmbed } from "./use-inventario-mercancia-embed";

describe("useInventarioMercanciaEmbed", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getBodegaExternaEmbedEligible.mockResolvedValue(true);
    client.listBodegaExternaEmbedReports.mockResolvedValue([]);
  });

  it("consulta elegibilidad cuando hay cuenta y no es inspección", async () => {
    const { result } = renderHook(() =>
      useInventarioMercanciaEmbed({
        step: "flow",
        codigoCuenta: "MIT00",
        inspect: false,
      }),
    );
    await waitFor(() => expect(result.current.embedEligible).toBe(true));
  });

  it("no es elegible en modo inspección", () => {
    const { result } = renderHook(() =>
      useInventarioMercanciaEmbed({
        step: "flow",
        codigoCuenta: "MIT00",
        inspect: true,
      }),
    );
    expect(result.current.embedEligible).toBe(false);
    expect(client.getBodegaExternaEmbedEligible).not.toHaveBeenCalled();
  });

  it("en reportes selecciona el único reporte y obtiene la URL", async () => {
    client.listBodegaExternaEmbedReports.mockResolvedValue([
      { id: "r1", descripcion: "Stock" },
    ]);
    client.mintBodegaExternaEmbedViewUrl.mockResolvedValue("https://x/view");

    const { result } = renderHook(() =>
      useInventarioMercanciaEmbed({
        step: "reportes",
        codigoCuenta: "MIT00",
        inspect: false,
      }),
    );

    await waitFor(() =>
      expect(result.current.embedViewUrl).toBe("https://x/view"),
    );
    expect(result.current.selectedEmbedReportId).toBe("r1");
    expect(client.mintBodegaExternaEmbedViewUrl).toHaveBeenCalledWith("r1");
  });

  it("reporta error al fallar el listado", async () => {
    client.listBodegaExternaEmbedReports.mockRejectedValue(new Error("falla"));
    const { result } = renderHook(() =>
      useInventarioMercanciaEmbed({
        step: "reportes",
        codigoCuenta: "MIT00",
        inspect: false,
      }),
    );
    await waitFor(() => expect(result.current.embedError).toBe("falla"));
  });
});
