import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FOLIO_FACTURA_ACTUALIZADO } from "../surtido/folio-factura-captura";
import { useFolioFacturaDetalle } from "./use-folio-factura-detalle";

const listar = vi.fn();
vi.mock("../surtido/list-orden-surtido-capturas.client", () => ({
  listOrdenSurtidoCapturasClient: (...args: unknown[]) => listar(...args),
}));

const captura = (idOrdenTrabajo: string, folio: string) => ({
  idOrdenTrabajo,
  payload: { campos: { facturaOkFolio: folio } },
});

describe("useFolioFacturaDetalle", () => {
  beforeEach(() => {
    listar.mockReset();
  });

  it("sin cuenta o sin id devuelve vacío y no consulta", () => {
    const { result } = renderHook(() => useFolioFacturaDetalle(null, "ov-1", undefined));
    expect(result.current).toBe("");
    renderHook(() => useFolioFacturaDetalle("C-1", "  ", undefined));
    expect(listar).not.toHaveBeenCalled();
  });

  it("sin OT activa toma el folio de la primera captura", async () => {
    listar.mockResolvedValue([captura("ot-1", "F-1"), captura("ot-2", "F-2")]);
    const { result } = renderHook(() => useFolioFacturaDetalle("C-1", "ov-1", undefined));
    await waitFor(() => expect(result.current).toBe("F-1"));
    expect(listar).toHaveBeenCalledWith({ codigoCuenta: "C-1", idOrdenVenta: "ov-1" });
  });

  it("con OT activa toma el folio de la captura de esa OT", async () => {
    listar.mockResolvedValue([captura("ot-1", "F-1"), captura("ot-2", "F-2")]);
    const { result } = renderHook(() => useFolioFacturaDetalle("C-1", "ov-1", "ot-2"));
    await waitFor(() => expect(result.current).toBe("F-2"));
  });

  it("si la consulta falla el folio queda vacío", async () => {
    listar.mockRejectedValue(new Error("red"));
    const { result } = renderHook(() => useFolioFacturaDetalle("C-1", "ov-1", undefined));
    await waitFor(() => expect(listar).toHaveBeenCalled());
    expect(result.current).toBe("");
  });

  it("recarga al recibir el evento de folio actualizado de esa OV", async () => {
    listar.mockResolvedValueOnce([captura("ot-1", "F-1")]);
    const { result } = renderHook(() => useFolioFacturaDetalle("C-1", "ov-1", undefined));
    await waitFor(() => expect(result.current).toBe("F-1"));

    listar.mockResolvedValueOnce([captura("ot-1", "F-NUEVO")]);
    act(() => {
      window.dispatchEvent(
        new CustomEvent(FOLIO_FACTURA_ACTUALIZADO, { detail: { idOrdenVenta: "ov-1" } }),
      );
    });
    await waitFor(() => expect(result.current).toBe("F-NUEVO"));
  });
});
