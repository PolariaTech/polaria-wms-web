import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useClientTablePagination } from "./useClientTablePagination";

describe("useClientTablePagination (REQ-114)", () => {
  it("no vuelve a la página 1 si solo cambia el total de filas", () => {
    const pageSize = 5;
    const initial = Array.from({ length: 30 }, (_, i) => i);
    const { result, rerender } = renderHook(
      ({ rows }) => useClientTablePagination(rows, pageSize, ""),
      { initialProps: { rows: initial } },
    );

    act(() => {
      result.current.setPage(5);
    });
    expect(result.current.page).toBe(5);

    // Confirmar una OV: una fila menos, misma búsqueda.
    const afterConfirm = initial.slice(0, 29);
    rerender({ rows: afterConfirm });

    expect(result.current.page).toBe(5);
    expect(result.current.paginatedRows).toEqual(afterConfirm.slice(20, 25));
  });

  it("ajusta a la última página si la actual queda fuera de rango", () => {
    const pageSize = 5;
    const initial = Array.from({ length: 12 }, (_, i) => i);
    const { result, rerender } = renderHook(
      ({ rows }) => useClientTablePagination(rows, pageSize, ""),
      { initialProps: { rows: initial } },
    );

    act(() => {
      result.current.setPage(3);
    });
    expect(result.current.page).toBe(3);

    // Quedan 5 filas → solo 1 página.
    rerender({ rows: initial.slice(0, 5) });
    expect(result.current.page).toBe(1);
  });

  it("sí vuelve a la página 1 cuando cambia la búsqueda (resetKey)", () => {
    const rows = Array.from({ length: 20 }, (_, i) => i);
    const { result, rerender } = renderHook(
      ({ resetKey }) => useClientTablePagination(rows, 5, resetKey),
      { initialProps: { resetKey: "" } },
    );

    act(() => {
      result.current.setPage(3);
    });
    expect(result.current.page).toBe(3);

    rerender({ resetKey: "hotel" });
    expect(result.current.page).toBe(1);
  });
});
