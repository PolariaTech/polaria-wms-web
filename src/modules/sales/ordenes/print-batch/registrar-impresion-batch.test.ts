import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { SilentPrintResult } from "../print/print-silent-cuenta";

const postLog = vi.fn();
vi.mock("../services/orden-venta-log.client", () => ({
  postOrdenVentaLogForOts: (...args: unknown[]) => postLog(...args),
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ session: { nombre: "Dani", idUsuario: "u1" } }) },
}));

import { registrarImpresionBatch } from "./registrar-impresion-batch";

const ov = (id: string) => ({ idOrdenVenta: id, venta: `OV-${id}`, idBodega: "b1" }) as OrdenVentaOperadorRow;
const hoja = (idOrdenVenta: string, idOrdenTrabajo: string) =>
  ({ idOrdenVenta, idOrdenTrabajo }) as OrdenTareaAlmacenPrintData;

beforeEach(() => vi.clearAllMocks());

describe("registrarImpresionBatch", () => {
  it("deja un registro por OV con solo sus propias OT", () => {
    registrarImpresionBatch({
      codigoCuenta: "JBR",
      enviado: { queue: { kind: "printing" }, impresora: "Brother" } as SilentPrintResult,
      previa: {
        resumen: [
          { row: ov("a"), ots: [1] },
          { row: ov("b"), ots: [1] },
        ],
        hojas: [hoja("a", "ot-a1"), hoja("b", "ot-b1"), hoja("b", "ot-b2")],
      },
    });
    expect(postLog).toHaveBeenCalledTimes(2);
    expect(postLog.mock.calls[0]![0]).toMatchObject({
      idOrdenVenta: "a",
      codigoCuenta: "JBR",
      idUsuario: "u1",
      idOrdenesTrabajo: ["ot-a1"],
    });
    expect(postLog.mock.calls[1]![0]).toMatchObject({
      idOrdenVenta: "b",
      idOrdenesTrabajo: ["ot-b1", "ot-b2"],
    });
  });

  it("sin OV elegidas no registra nada", () => {
    registrarImpresionBatch({
      codigoCuenta: "JBR",
      enviado: { queue: { kind: "printing" }, impresora: "Brother" } as SilentPrintResult,
      previa: { resumen: [], hojas: [] },
    });
    expect(postLog).not.toHaveBeenCalled();
  });
});
