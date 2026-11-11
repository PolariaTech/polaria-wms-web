import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

const armarPdf = vi.fn();
vi.mock("../print/download-orden-tarea-almacen-pdf", () => ({
  buildOrdenTareaAlmacenLandscapePdfBlob: (...args: unknown[]) => armarPdf(...args),
}));
const armarConOc = vi.fn();
vi.mock("./armar-paquete-con-oc", () => ({
  armarPaqueteConOc: (...args: unknown[]) => armarConOc(...args),
  dependenciasReales: () => ({ marca: "dependencias" }),
}));

import { armarPreviaDetallada } from "./armar-previa-detallada";

const HOJAS = [{ idOrdenVenta: "a" } as OrdenTareaAlmacenPrintData];
const RESUMEN = [{ row: { idOrdenVenta: "a", venta: "OV-a", fechaEntrega: "2026-11-06" } as OrdenVentaOperadorRow, ots: [1] }];

function entrada(extra: { conOc: boolean }) {
  return {
    codigoCuenta: "1YW43",
    zonaHoraria: "America/Bogota",
    hojas: HOJAS,
    resumen: RESUMEN,
    origenPorOv: new Map<string, string | null | undefined>(),
    alProgreso: vi.fn(),
    ...extra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  armarPdf.mockResolvedValue({ blob: new Blob(["hojas"]), filename: "x.pdf" });
});

describe("armarPreviaDetallada", () => {
  it("sin OC es el PDF de las hojas elegidas, sin resumen ni partes", async () => {
    const previa = await armarPreviaDetallada(entrada({ conOc: false }));

    expect(await previa.blob.text()).toBe("hojas");
    expect(previa.hojas).toBe(HOJAS);
    expect(previa.partes).toBeUndefined();
    expect(previa.resumenPdf).toBeUndefined();
    expect(armarConOc).not.toHaveBeenCalled();
    expect(armarPdf).toHaveBeenCalledWith(HOJAS, { codigoCuenta: "1YW43" });
  });

  it("con OC arma el paquete con las órdenes de compra y la vista previa es la primera parte", async () => {
    const resumenPdf = { titulo: "Resumen de impresión", subtitulo: "Impresión detallada", generado: "", filas: [] };
    armarConOc.mockResolvedValue({
      partes: [
        { hojas: HOJAS, resumen: RESUMEN, pdf: new Blob(["parte 1"]) },
        { hojas: HOJAS, resumen: RESUMEN, pdf: new Blob(["parte 2"]) },
      ],
      resumenPdf,
    });

    const previa = await armarPreviaDetallada(entrada({ conOc: true }));

    expect(await previa.blob.text()).toBe("parte 1");
    expect(previa.partes).toHaveLength(2);
    expect(previa.resumenPdf).toBe(resumenPdf);
    expect(armarConOc).toHaveBeenCalledWith(
      expect.objectContaining({ hojas: HOJAS, subtitulo: "Impresión detallada · entrega 06/11/2026", generado: expect.stringMatching(/^Generado /) }),
      { marca: "dependencias" },
    );
  });
});
