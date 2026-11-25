import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOvFechaFiltroStore } from "@/stores/ov-fecha-filtro.store";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { contarPorEstado, useOrdenesVentaFilas } from "./use-ordenes-venta-filas";

vi.mock("./use-ov-edit-presence-poll", async (importar) => ({
  ...(await importar<typeof import("./use-ov-edit-presence-poll")>()),
  useOvEditPresencePoll: () => ({
    "ov-2": { editLockedBy: "u-9", editLockedAt: "2026-01-01", editLockedNombre: "Ana" },
  }),
}));
vi.mock("../components/pages/filtrar-por-fecha-entrega", () => ({
  ordenPasaFiltroFechaEntrega: (fecha: string | null) => fecha === "HOY",
}));

const fila = (id: string, estado: string, fechaEntrega: string | null = null) =>
  ({ idOrdenVenta: id, estado, fechaEntrega }) as unknown as OrdenVentaOperadorRow;

const data = {
  rows: [fila("ov-1", "confirmada", "HOY"), fila("ov-2", "por_confirmar", "OTRO"), fila("ov-3", "confirmada", "HOY")],
  idsConFotosCaptura: new Set<string>(),
  idsCorreoNoEnviado: new Set<string>(),
};

function usar(estadoFiltro: Parameters<typeof useOrdenesVentaFilas>[0]["estadoFiltro"] = null) {
  return renderHook(() =>
    useOrdenesVentaFilas({
      data,
      codigoCuenta: "C-1",
      inspect: false,
      zonaHoraria: "America/Bogota",
      estadoFiltro,
    }),
  );
}

describe("contarPorEstado", () => {
  it("incluye todos los estados, aun en 0", () => {
    const c = contarPorEstado([fila("a", "confirmada"), fila("b", "confirmada"), fila("c", "cancelada")]);
    expect(c.confirmada).toBe(2);
    expect(c.cancelada).toBe(1);
    expect(c.por_confirmar).toBe(0);
    expect(Object.keys(c)).toHaveLength(8);
  });
});

describe("useOrdenesVentaFilas", () => {
  beforeEach(() => {
    act(() => useOvFechaFiltroStore.setState({ dia: null }));
  });

  it("sin filtros devuelve todas las filas y mezcla la presencia de edición", () => {
    const { result } = usar();
    expect(result.current.rows.map((r) => r.idOrdenVenta)).toEqual(["ov-1", "ov-2", "ov-3"]);
    expect(result.current.rows[1]).toMatchObject({ editLockedBy: "u-9", editLockedNombre: "Ana" });
    expect(result.current.filteredRows).toHaveLength(3);
    expect(result.current.rowsRef.current).toBe(result.current.rows);
  });

  it("el filtro por día deja solo las órdenes que pasan por fecha de entrega", () => {
    act(() => useOvFechaFiltroStore.setState({ dia: "2026-01-01" }));
    const { result } = usar();
    expect(result.current.fechaFiltroDia).toBe("2026-01-01");
    expect(result.current.rowsDelDia.map((r) => r.idOrdenVenta)).toEqual(["ov-1", "ov-3"]);
    expect(result.current.countsByEstado.por_confirmar).toBe(0);
  });

  it("el filtro por estado recorta filteredRows pero no los conteos", () => {
    const { result } = usar("por_confirmar");
    expect(result.current.filteredRows.map((r) => r.idOrdenVenta)).toEqual(["ov-2"]);
    expect(result.current.countsByEstado.confirmada).toBe(2);
  });

  it("sin datos devuelve listas vacías", () => {
    const { result } = renderHook(() =>
      useOrdenesVentaFilas({
        data: null,
        codigoCuenta: null,
        inspect: true,
        zonaHoraria: "UTC",
        estadoFiltro: null,
      }),
    );
    expect(result.current.rows).toEqual([]);
    expect(result.current.filteredRows).toEqual([]);
  });
});
