import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { useOvLoadPrintSheets } from "./use-ov-load-print-sheets";

const getDetalle = vi.fn();
const mapHojas = vi.fn();
const listarCapturas = vi.fn();
const aplicarSurtido = vi.fn();

vi.mock("../../shared/services/sales.service", () => ({
  getOrdenVentaDetalle: (...a: unknown[]) => getDetalle(...a),
}));
vi.mock("../print/map-orden-tarea-almacen", () => ({
  mapOrdenVentaToAlmacenPrintSheets: (...a: unknown[]) => mapHojas(...a),
}));
vi.mock("../surtido/list-orden-surtido-capturas.client", () => ({
  listOrdenSurtidoCapturasClient: (...a: unknown[]) => listarCapturas(...a),
}));
vi.mock("../surtido/apply-surtido-to-print", () => ({
  applySurtidoCapturasToPrintSheets: (...a: unknown[]) => aplicarSurtido(...a),
}));

const row = { idOrdenVenta: "ov-1" } as OrdenVentaOperadorRow;
const runScoped = vi.fn(<T,>(fn: () => Promise<T>) => fn());

function cargar(codigoCuenta: string | null) {
  const { result } = renderHook(() =>
    useOvLoadPrintSheets({ codigoCuenta, runScoped, zonaHoraria: "America/Bogota" }),
  );
  return result.current(row);
}

describe("useOvLoadPrintSheets", () => {
  beforeEach(() => {
    getDetalle.mockReset().mockResolvedValue({ id: "det" });
    mapHojas.mockReset().mockReturnValue(["hoja-base"]);
    listarCapturas.mockReset().mockResolvedValue(["captura"]);
    aplicarSurtido.mockReset().mockReturnValue(["hoja-con-surtido"]);
  });

  it("arma las hojas con detalle y zona horaria, y les aplica el surtido", async () => {
    await expect(cargar("C-1")).resolves.toEqual(["hoja-con-surtido"]);
    expect(getDetalle).toHaveBeenCalledWith({ codigoCuenta: "C-1", idOrdenVenta: "ov-1" });
    expect(mapHojas).toHaveBeenCalledWith({
      listRow: row,
      detalle: { id: "det" },
      timeZone: "America/Bogota",
    });
    expect(aplicarSurtido).toHaveBeenCalledWith(["hoja-base"], ["captura"]);
  });

  it("sin cuenta usa solo la fila del listado y no consulta nada", async () => {
    await expect(cargar(null)).resolves.toEqual(["hoja-base"]);
    expect(getDetalle).not.toHaveBeenCalled();
    expect(listarCapturas).not.toHaveBeenCalled();
    expect(mapHojas).toHaveBeenCalledWith(expect.objectContaining({ detalle: null }));
  });

  it("si falla el detalle sigue con detalle null", async () => {
    getDetalle.mockRejectedValue(new Error("x"));
    await cargar("C-1");
    expect(mapHojas).toHaveBeenCalledWith(expect.objectContaining({ detalle: null }));
  });

  it("si falla el surtido devuelve las hojas sin surtido", async () => {
    listarCapturas.mockRejectedValue(new Error("x"));
    await expect(cargar("C-1")).resolves.toEqual(["hoja-base"]);
    expect(aplicarSurtido).not.toHaveBeenCalled();
  });
});
