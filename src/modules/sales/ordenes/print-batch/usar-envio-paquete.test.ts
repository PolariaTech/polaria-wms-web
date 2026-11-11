import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

const enviarPaquete = vi.fn();
vi.mock("./enviar-paquete", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("./enviar-paquete")>()),
  enviarPaquete: (...args: unknown[]) => enviarPaquete(...args),
}));
const impresoraActiva = vi.fn();
vi.mock("@/modules/configurator/impresoras/services/impresoras.service", () => ({
  getImpresoraActivaCuenta: (...args: unknown[]) => impresoraActiva(...args),
}));

import { useEnvioPaquete } from "./usar-envio-paquete";
import type { PreviaBatch } from "./utilidades-batch";

const PREVIA: PreviaBatch = {
  blob: new Blob(["x"]),
  hojas: [{ idOrdenVenta: "a" } as OrdenTareaAlmacenPrintData],
  resumen: [{ row: { idOrdenVenta: "a", venta: "OV-a" } as OrdenVentaOperadorRow, ots: [1] }],
  nombreArchivo: "x.pdf",
};

function montar() {
  const acciones = { alIniciar: vi.fn(), alFallar: vi.fn(), alTerminar: vi.fn() };
  const vista = renderHook(() => useEnvioPaquete({ codigoCuenta: "1YW43", zonaHoraria: "America/Bogota" }));
  return { acciones, ...vista };
}

beforeEach(() => {
  vi.clearAllMocks();
  impresoraActiva.mockResolvedValue({ nombre: " Brother cocina ", modoEnvio: "ipp" });
});

describe("useEnvioPaquete", () => {
  it("al pedir la confirmación la abre y trae el nombre de la impresora activa", async () => {
    const { result } = montar();

    act(() => result.current.pedirConfirmacion());

    expect(result.current.confirmando).toBe(true);
    await waitFor(() => expect(result.current.impresora).toBe("Brother cocina"));
    expect(result.current.modoEnvio).toBe("ipp");
  });

  it("si salió todo, avisa con el resultado de la cola y deja el reintento en la primera parte", async () => {
    enviarPaquete.mockResolvedValue({ siguiente: 1, ultimo: { queue: { kind: "printing" }, impresora: "Brother" } });
    const { result, acciones } = montar();

    await act(() => result.current.imprimir(PREVIA, acciones));

    expect(acciones.alIniciar).toHaveBeenCalledTimes(1);
    expect(acciones.alFallar).not.toHaveBeenCalled();
    expect(acciones.alTerminar).toHaveBeenCalledWith(expect.objectContaining({ tipo: "ok", detail: expect.stringContaining("Terminó a las") }));
    expect(result.current.siguienteParte).toBe(0);
    expect(result.current.imprimiendo).toBe(false);
  });

  it("si la cola quedó en espera, el aviso no es de «todo bien»", async () => {
    enviarPaquete.mockResolvedValue({ siguiente: 1, ultimo: { queue: { kind: "queued" }, impresora: "Brother" } });
    const { result, acciones } = montar();

    await act(() => result.current.imprimir(PREVIA, acciones));

    expect(acciones.alTerminar).toHaveBeenCalledWith(expect.objectContaining({ tipo: "aviso" }));
  });

  it("si falla a mitad, dice cuántas salieron y la próxima vez retoma desde la parte que falló", async () => {
    enviarPaquete.mockResolvedValue({ siguiente: 1, error: new Error("La impresora no responde.") });
    const { result, acciones } = montar();

    await act(() => result.current.imprimir({ ...PREVIA, partes: [{ hojas: [], resumen: [] }, { hojas: [], resumen: [] }] }, acciones));

    expect(acciones.alTerminar).not.toHaveBeenCalled();
    expect(acciones.alFallar).toHaveBeenCalledWith(expect.stringContaining("Salieron 1 de 2 partes"));
    expect(result.current.siguienteParte).toBe(1);

    await act(() => result.current.imprimir(PREVIA, acciones));
    expect(enviarPaquete).toHaveBeenLastCalledWith(expect.objectContaining({ desde: 1 }));

    act(() => result.current.reiniciarPartes());
    expect(result.current.siguienteParte).toBe(0);
  });

  it("sin vista previa no manda nada", async () => {
    const { result, acciones } = montar();

    await act(() => result.current.imprimir(null, acciones));

    expect(enviarPaquete).not.toHaveBeenCalled();
    expect(acciones.alIniciar).not.toHaveBeenCalled();
  });
});
