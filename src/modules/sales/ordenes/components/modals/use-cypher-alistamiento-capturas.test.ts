import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCypherAlistamientoCapturas } from "./use-cypher-alistamiento-capturas";

vi.mock("../../surtido/folio-factura-captura", () => ({
  useRecargaFolioFactura: () => 0,
}));

describe("useCypherAlistamientoCapturas", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ capturas: [{ idOrdenTrabajo: "ot-1" }] }),
      }),
    );
  });

  it("carga capturas y indexa por OT", async () => {
    const { result } = renderHook(() =>
      useCypherAlistamientoCapturas("ov-123"),
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.capturas).toHaveLength(1);
    expect(result.current.capturaByOt.size).toBeGreaterThan(0);
  });
});