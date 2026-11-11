import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";

const idsOvYaImpresas = vi.fn();
vi.mock("./ya-impresas", () => ({
  idsOvYaImpresas: (...args: unknown[]) => idsOvYaImpresas(...args),
}));

import { useYaImpresas } from "./usar-ya-impresas";

const ROWS = [{ idOrdenVenta: "a" }, { idOrdenVenta: "b" }] as OrdenVentaOperadorRow[];
const runScoped = <T,>(tarea: () => Promise<T>) => tarea();

function montar(activo: boolean, rows: readonly OrdenVentaOperadorRow[] = ROWS) {
  return renderHook((props: { activo: boolean }) => useYaImpresas({ codigoCuenta: "1YW43", rows, runScoped, activo: props.activo }), {
    initialProps: { activo },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  idsOvYaImpresas.mockResolvedValue(new Set(["a"]));
});

describe("useYaImpresas", () => {
  it("no lee ningún registro mientras no hace falta", () => {
    const { result } = montar(false);

    expect(idsOvYaImpresas).not.toHaveBeenCalled();
    expect(result.current.ids).toBeNull();
    expect(result.current.buscando).toBe(false);
  });

  it("al activarse lee el registro una sola vez y entrega los ids de las OV ya impresas", async () => {
    const { result, rerender } = montar(false);

    rerender({ activo: true });
    expect(result.current.buscando).toBe(true);

    await waitFor(() => expect(result.current.ids).toEqual(new Set(["a"])));
    expect(result.current.buscando).toBe(false);
    rerender({ activo: true });
    expect(idsOvYaImpresas).toHaveBeenCalledTimes(1);
  });

  it("cuenta el avance de la lectura", async () => {
    idsOvYaImpresas.mockImplementation(async (entrada: { onProgreso: (leidas: number, total: number) => void }) => {
      entrada.onProgreso(1, 2);
      await new Promise((resolver) => setTimeout(resolver, 20));
      return new Set<string>();
    });
    const { result } = montar(true);

    await waitFor(() => expect(result.current.progreso).toBe("Revisando OV 1 de 2…"));
    await waitFor(() => expect(result.current.progreso).toBeNull());
  });

  it("recargar descarta lo leído y vuelve a leer", async () => {
    const { result } = montar(true);
    await waitFor(() => expect(result.current.ids).not.toBeNull());

    act(() => result.current.recargar());

    await waitFor(() => expect(idsOvYaImpresas).toHaveBeenCalledTimes(2));
  });

  it("sin órdenes no busca nada", () => {
    const { result } = montar(true, []);

    expect(idsOvYaImpresas).not.toHaveBeenCalled();
    expect(result.current.buscando).toBe(false);
  });
});
