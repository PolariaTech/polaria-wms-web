import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { ResumenImpresionPdf } from "../print/render-resumen-impresion-pdf";

const armarBlob = vi.fn();
const numerar = vi.fn();

vi.mock("../print/download-orden-tarea-almacen-pdf", () => ({
  buildOrdenTareaAlmacenLandscapePdfBlob: (...args: unknown[]) => armarBlob(...args),
}));
vi.mock("../print/numerar-hojas-pdf", () => ({
  numerarBlobPdf: (...args: unknown[]) => numerar(...args),
}));

import { armarPartePdf, nombreArchivoParte } from "./armar-parte-pdf";
import type { ParteEnvio } from "./partir-paquete";

const RESUMEN = { titulo: "Resumen", subtitulo: "", generado: "", filas: [] } as ResumenImpresionPdf;

function parte(extra: Partial<ParteEnvio> = {}): ParteEnvio {
  return { hojas: [{ idOrdenVenta: "a" } as OrdenTareaAlmacenPrintData], resumen: [], ...extra };
}

beforeEach(() => {
  vi.clearAllMocks();
  armarBlob.mockImplementation(async () => ({ blob: new Blob(["armado"]), filename: "x.pdf" }));
  numerar.mockImplementation(async (_blob: Blob, etiqueta?: string) => new Blob([`numerado ${etiqueta ?? "sin parte"}`]));
});

describe("armarPartePdf", () => {
  it("con OC devuelve el PDF que la parte ya trae, sin armar nada", async () => {
    const pdf = new Blob(["con oc"]);

    const blob = await armarPartePdf({ parte: parte({ pdf }), indice: 1, total: 3, resumenPdf: RESUMEN, codigoCuenta: "1YW43" });

    expect(blob).toBe(pdf);
    expect(armarBlob).not.toHaveBeenCalled();
  });

  it("sin OC pone el resumen solo en la primera parte y numera con la etiqueta de la parte", async () => {
    const primera = await armarPartePdf({ parte: parte(), indice: 0, total: 2, resumenPdf: RESUMEN, codigoCuenta: "1YW43" });
    const segunda = await armarPartePdf({ parte: parte(), indice: 1, total: 2, resumenPdf: RESUMEN, codigoCuenta: "1YW43" });

    expect(armarBlob).toHaveBeenNthCalledWith(1, expect.any(Array), { codigoCuenta: "1YW43", resumen: RESUMEN });
    expect(armarBlob).toHaveBeenNthCalledWith(2, expect.any(Array), { codigoCuenta: "1YW43", resumen: undefined });
    expect(await primera.text()).toBe("numerado 1/2");
    expect(await segunda.text()).toBe("numerado 2/2");
  });

  it("con una sola parte numera sin etiqueta de parte", async () => {
    const blob = await armarPartePdf({ parte: parte(), indice: 0, total: 1, resumenPdf: RESUMEN, codigoCuenta: "1YW43" });

    expect(await blob.text()).toBe("numerado sin parte");
  });

  it("sin resumen (impresión detallada) devuelve las hojas armadas, sin numerar", async () => {
    const blob = await armarPartePdf({ parte: parte(), indice: 0, total: 1, codigoCuenta: "1YW43" });

    expect(await blob.text()).toBe("armado");
    expect(numerar).not.toHaveBeenCalled();
  });
});

describe("nombreArchivoParte", () => {
  it("añade la posición de la parte antes de la extensión", () => {
    expect(nombreArchivoParte("impresion-batch-20261110-1530.pdf", 1, 6)).toBe(
      "impresion-batch-20261110-1530-parte-2-de-6.pdf",
    );
  });
});
