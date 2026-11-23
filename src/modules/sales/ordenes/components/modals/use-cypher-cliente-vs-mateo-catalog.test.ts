import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCypherClienteVsMateoCatalog } from "./use-cypher-cliente-vs-mateo-catalog";

const fetchProductos = vi.fn();
const listCompradores = vi.fn();

vi.mock("../../../shared/services/sales-catalog.api", () => ({
  fetchProductosVentaCatalogo: (cuenta: string) => fetchProductos(cuenta),
}));

vi.mock("@/modules/admin-panel/compradores/services/compradores.service", () => ({
  listCompradoresAdmin: (opts: unknown) => listCompradores(opts),
}));

describe("useCypherClienteVsMateoCatalog", () => {
  beforeEach(() => {
    fetchProductos.mockReset();
    listCompradores.mockReset();
  });

  it("vacía catálogos si no hay codigo cuenta", () => {
    const { result } = renderHook(() => useCypherClienteVsMateoCatalog(undefined));
    expect(result.current.productos).toEqual([]);
    expect(result.current.compradores).toEqual([]);
    expect(fetchProductos).not.toHaveBeenCalled();
  });

  it("carga productos y compradores", async () => {
    fetchProductos.mockResolvedValue([{ idProducto: "p1" }]);
    listCompradores.mockResolvedValue([{ idComprador: "c1" }]);

    const { result } = renderHook(() => useCypherClienteVsMateoCatalog("ACC"));

    await waitFor(() => {
      expect(result.current.productos).toHaveLength(1);
      expect(result.current.compradores).toHaveLength(1);
    });
  });
});