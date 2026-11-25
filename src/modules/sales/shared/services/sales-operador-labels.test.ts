import { describe, expect, it } from "vitest";
import {
  chunkIds,
  fetchBodegaDestinoLabels,
  fetchCompradorLabels,
  fetchCuentaOvSlaByCodigo,
  fetchLineasResumenByOrden,
  formatProductosResumen,
} from "./sales-operador-labels";

describe("sales-operador-labels", () => {
  it("formatProductosResumen", () => {
    expect(formatProductosResumen(0)).toBe("—");
    expect(formatProductosResumen(1)).toBe("1 producto");
    expect(formatProductosResumen(3)).toBe("3 productos");
  });

  it("chunkIds parte en tandas", () => {
    expect(chunkIds(["a", "b", "c"], 2)).toEqual([["a", "b"], ["c"]]);
    expect(chunkIds([], 2)).toEqual([]);
  });

  it("devuelve mapas vacíos sin ids", async () => {
    expect((await fetchCompradorLabels([])).size).toBe(0);
    expect((await fetchBodegaDestinoLabels([])).size).toBe(0);
    expect((await fetchLineasResumenByOrden([])).size).toBe(0);
    expect((await fetchCuentaOvSlaByCodigo([" "])).size).toBe(0);
  });
});
