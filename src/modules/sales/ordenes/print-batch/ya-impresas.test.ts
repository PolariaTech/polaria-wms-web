import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { fetchOrdenVentaLog } from "../services/orden-venta-log.client";
import { idsOvYaImpresas, leerYaImpresas } from "./ya-impresas";

vi.mock("../services/orden-venta-log.client", () => ({ fetchOrdenVentaLog: vi.fn() }));

const fetchLog = vi.mocked(fetchOrdenVentaLog);
const runScoped = <T,>(tarea: () => Promise<T>) => tarea();

function fila(id: string): OrdenVentaOperadorRow {
  return { idOrdenVenta: id } as OrdenVentaOperadorRow;
}

function logDe(...tipos: Array<string | null>) {
  return tipos.map((payloadTipo) => ({ payloadTipo })) as Awaited<
    ReturnType<typeof fetchOrdenVentaLog>
  >;
}

describe("idsOvYaImpresas", () => {
  beforeEach(() => {
    fetchLog.mockReset();
  });

  it("marca como impresas las OV con una impresión manual o automática en el log", async () => {
    fetchLog.mockImplementation(async ({ idOrdenVenta }) => {
      if (idOrdenVenta === "a") return logDe("impresion_pdf");
      if (idOrdenVenta === "b") return logDe("otro", "impresion_pdf_auto");
      return logDe("otro", null);
    });

    const impresas = await idsOvYaImpresas({
      codigoCuenta: "JBR",
      rows: [fila("a"), fila("b"), fila("c")],
      runScoped,
    });

    expect([...impresas].sort()).toEqual(["a", "b"]);
  });

  it("si el log de una OV falla la trata como no impresa y sigue con las demás", async () => {
    fetchLog.mockImplementation(async ({ idOrdenVenta }) => {
      if (idOrdenVenta === "a") throw new Error("sin red");
      return logDe("impresion_pdf");
    });

    const impresas = await idsOvYaImpresas({
      codigoCuenta: "JBR",
      rows: [fila("a"), fila("b")],
      runScoped,
    });

    expect([...impresas]).toEqual(["b"]);
  });

  it("avisa el avance y lee cada OV una sola vez", async () => {
    fetchLog.mockResolvedValue(logDe());
    const avances: Array<[number, number]> = [];

    await idsOvYaImpresas({
      codigoCuenta: "JBR",
      rows: Array.from({ length: 9 }, (_, i) => fila(`ov${i}`)),
      runScoped,
      onProgreso: (leidas, total) => avances.push([leidas, total]),
    });

    expect(fetchLog).toHaveBeenCalledTimes(9);
    expect(avances).toHaveLength(9);
    expect(avances.at(-1)).toEqual([9, 9]);
  });

  it("sin OV no consulta nada", async () => {
    const impresas = await idsOvYaImpresas({ codigoCuenta: "JBR", rows: [], runScoped });

    expect(impresas.size).toBe(0);
    expect(fetchLog).not.toHaveBeenCalled();
  });
});

describe("leerYaImpresas", () => {
  beforeEach(() => {
    fetchLog.mockReset();
  });

  it("cuenta las OV cuyo log no se pudo leer, para poder avisarlo", async () => {
    fetchLog.mockImplementation(async ({ idOrdenVenta }) => {
      if (idOrdenVenta === "a" || idOrdenVenta === "c") throw new Error("sin red");
      return logDe("impresion_pdf");
    });

    const { impresas, fallidas } = await leerYaImpresas({
      codigoCuenta: "JBR",
      rows: [fila("a"), fila("b"), fila("c")],
      runScoped,
    });

    expect([...impresas]).toEqual(["b"]);
    expect(fallidas).toBe(2);
  });

  it("si todo se lee bien no hay fallidas", async () => {
    fetchLog.mockResolvedValue(logDe());

    const { fallidas } = await leerYaImpresas({ codigoCuenta: "JBR", rows: [fila("a")], runScoped });

    expect(fallidas).toBe(0);
  });
});
