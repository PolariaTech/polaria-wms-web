import { jsPDF } from "jspdf";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";
import type { ResumenImpresionPdf } from "./render-resumen-impresion-pdf";

const anadirResumen = vi.fn();
const imprimirPdf = vi.fn();

vi.mock("./render-resumen-impresion-pdf", () => ({
  anadirResumenAlPdf: (...args: unknown[]) => anadirResumen(...args),
}));
vi.mock("./render-orden-tarea-almacen-landscape-pdf", () => ({
  buildOrdenTareaAlmacenLandscapePdfMulti: () => new jsPDF(),
}));
vi.mock("./map-orden-tarea-almacen", () => ({
  stampOrdenTareaImpresaNow: (sheets: unknown) => sheets,
}));
vi.mock("./print-silent-cuenta", () => ({
  printPdfSilentToCuenta: (...args: unknown[]) => imprimirPdf(...args),
}));

import {
  buildOrdenTareaAlmacenLandscapePdfBlob,
  printOrdenTareaAlmacenLandscape,
} from "./download-orden-tarea-almacen-pdf";

// Sin idOrdenVenta no se genera QR: la hoja pasa tal cual.
const HOJA = { folio: "OV-1" } as OrdenTareaAlmacenPrintData;
const RESUMEN: ResumenImpresionPdf = {
  titulo: "Resumen de impresión",
  subtitulo: "Impresión rápida",
  generado: "Generado",
  filas: [{ venta: "OV-1", cliente: "Hotel Sol", entrega: "05/11/2026", ot: 1, hojas: 1 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  imprimirPdf.mockResolvedValue({ queue: { kind: "printing" }, impresora: "Brother" });
});

describe("buildOrdenTareaAlmacenLandscapePdfBlob", () => {
  it("sin resumen arma el PDF solo con las hojas", async () => {
    const { blob } = await buildOrdenTareaAlmacenLandscapePdfBlob([HOJA], { codigoCuenta: "JBR" });

    expect(blob.size).toBeGreaterThan(0);
    expect(anadirResumen).not.toHaveBeenCalled();
  });

  it("con resumen lo agrega al PDF de la vista previa", async () => {
    await buildOrdenTareaAlmacenLandscapePdfBlob([HOJA], { codigoCuenta: "JBR", resumen: RESUMEN });

    expect(anadirResumen).toHaveBeenCalledTimes(1);
    expect(anadirResumen.mock.calls[0]![0]).toEqual(
      expect.objectContaining({ insertPage: expect.any(Function), output: expect.any(Function) }),
    );
    expect(anadirResumen.mock.calls[0]![1]).toBe(RESUMEN);
  });

  it("sin hojas falla en vez de armar un PDF vacío", async () => {
    await expect(buildOrdenTareaAlmacenLandscapePdfBlob([])).rejects.toThrow("No hay órdenes de trabajo");
  });
});

describe("printOrdenTareaAlmacenLandscape", () => {
  it("con resumen manda a la impresora el mismo PDF que lo lleva", async () => {
    await printOrdenTareaAlmacenLandscape([HOJA], { codigoCuenta: "JBR", resumen: RESUMEN });

    expect(anadirResumen).toHaveBeenCalledTimes(1);
    expect(anadirResumen.mock.calls[0]![1]).toBe(RESUMEN);
    expect(imprimirPdf).toHaveBeenCalledTimes(1);
  });

  it("si va en partes, el nombre del trabajo lleva «(2/5)» para distinguir los correos", async () => {
    await printOrdenTareaAlmacenLandscape([HOJA], { codigoCuenta: "JBR", etiquetaParte: "2/5" });

    expect(imprimirPdf.mock.calls[0]![0].jobName).toBe("OV OV-1 (2/5)");
  });

  it("sin partes el nombre del trabajo queda como siempre", async () => {
    await printOrdenTareaAlmacenLandscape([HOJA], { codigoCuenta: "JBR" });

    expect(imprimirPdf.mock.calls[0]![0].jobName).toBe("OV OV-1");
  });

  it("sin resumen imprime solo las hojas", async () => {
    await printOrdenTareaAlmacenLandscape([HOJA], { codigoCuenta: "JBR" });

    expect(anadirResumen).not.toHaveBeenCalled();
    expect(imprimirPdf).toHaveBeenCalledTimes(1);
  });

  it("sin cuenta activa no imprime", async () => {
    await expect(printOrdenTareaAlmacenLandscape([HOJA], {})).rejects.toThrow("falta la cuenta activa");
    expect(imprimirPdf).not.toHaveBeenCalled();
  });
});
