import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { ResumenOvBatch } from "./batch-seleccion";

const armarPdf = vi.fn();
const armarConOc = vi.fn();

vi.mock("../print/download-orden-tarea-almacen-pdf", () => ({
  buildOrdenTareaAlmacenLandscapePdfBlob: (...args: unknown[]) => armarPdf(...args),
}));
const numerar = vi.fn();
vi.mock("../print/numerar-hojas-pdf", () => ({
  numerarBlobPdf: (...args: unknown[]) => numerar(...args),
}));
vi.mock("./armar-paquete-con-oc", async (importarOriginal) => ({
  ...(await importarOriginal<object>()),
  armarPaqueteConOc: (...args: unknown[]) => armarConOc(...args),
}));

import { armarPreviaRapida, type EntradaPreviaRapida } from "./armar-previa-rapida";

function ov(id: string): ResumenOvBatch {
  return {
    row: { idOrdenVenta: id, venta: `OV-${id}`, comprador: "Hotel Sol", fechaEntrega: "2026-11-05" } as OrdenVentaOperadorRow,
    ots: [1],
  };
}

const hoja = (id: string) => ({ idOrdenVenta: id, tareaIndex: 1 }) as OrdenTareaAlmacenPrintData;

function entrada(extra: Partial<EntradaPreviaRapida> = {}): EntradaPreviaRapida {
  return {
    codigoCuenta: "JBR",
    fecha: "2026-11-05",
    zonaHoraria: "America/Bogota",
    hojas: [hoja("a"), hoja("b")],
    resumen: [ov("a"), ov("b")],
    conOc: false,
    origenPorOv: new Map(),
    alProgreso: vi.fn(),
    ...extra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  armarPdf.mockResolvedValue({ blob: new Blob(["%PDF"]), filename: "x.pdf" });
  numerar.mockResolvedValue(new Blob(["numerado"]));
});

describe("armarPreviaRapida sin OC", () => {
  it("arma el PDF de las OT con el resumen de primera hoja, y con pocas hojas no mide nada", async () => {
    const previa = await armarPreviaRapida(entrada());

    expect(armarPdf).toHaveBeenCalledTimes(1);
    expect(armarPdf.mock.calls[0]![1].resumen.subtitulo).toBe("Impresión rápida · entrega 05/11/2026");
    expect(previa.partes).toHaveLength(1);
    expect(previa.partes![0]!.pdf).toBeUndefined();
    expect(armarConOc).not.toHaveBeenCalled();
  });

  it("con un solo envío la vista previa sale numerada («Hoja N de M»)", async () => {
    const previa = await armarPreviaRapida(entrada());

    expect(numerar).toHaveBeenCalledTimes(1);
    expect(await (numerar.mock.calls[0]![0] as Blob).text()).toBe("%PDF");
    expect(await previa.blob.text()).toBe("numerado");
  });

  it("con muchas hojas mide el peso real con un PDF de prueba antes de partir", async () => {
    const hojas = Array.from({ length: 200 }, (_, i) => hoja(`v${i}`));
    const alProgreso = vi.fn();

    await armarPreviaRapida(entrada({ hojas, resumen: hojas.map((h) => ov(h.idOrdenVenta!)), alProgreso }));

    expect(armarPdf).toHaveBeenCalledTimes(2);
    expect(armarPdf.mock.calls[0]![1].resumen).toBeUndefined();
    expect(alProgreso).toHaveBeenCalledWith("Midiendo el tamaño del paquete…");
  });

  it("si el paquete se parte en envíos la vista previa no se numera: cada envío cuenta desde 1", async () => {
    const hojas = Array.from({ length: 200 }, (_, i) => hoja(`v${i}`));
    // 20 MB entre 200 hojas = 100 KB por hoja: caben ~25 por envío de 3 MB, así que se parte.
    armarPdf.mockResolvedValue({ blob: new Blob([new Uint8Array(20 * 1024 * 1024)]), filename: "x.pdf" });

    const previa = await armarPreviaRapida(entrada({ hojas, resumen: hojas.map((h) => ov(h.idOrdenVenta!)) }));

    expect(previa.partes!.length).toBeGreaterThan(1);
    expect(numerar).not.toHaveBeenCalled();
  });
});

describe("armarPreviaRapida con OC", () => {
  it("arma el paquete con OC y la vista previa es el PDF de la primera parte", async () => {
    const primera = new Blob(["parte 1"]);
    armarConOc.mockResolvedValue({
      partes: [{ hojas: [hoja("a")], resumen: [ov("a")], pdf: primera }, { hojas: [hoja("b")], resumen: [ov("b")], pdf: new Blob(["parte 2"]) }],
      resumenPdf: { titulo: "Resumen de impresión", subtitulo: "x", generado: "y", filas: [] },
    });
    const origenPorOv = new Map([["a", '[{"nombre":"pedido.pdf"}]']]);

    const previa = await armarPreviaRapida(entrada({ conOc: true, origenPorOv }));

    expect(previa.blob).toBe(primera);
    expect(previa.partes).toHaveLength(2);
    expect(previa.resumenPdf?.titulo).toBe("Resumen de impresión");
    const [datos] = armarConOc.mock.calls[0]!;
    expect(datos.origenPorOv).toBe(origenPorOv);
    expect(datos.subtitulo).toBe("Impresión rápida · entrega 05/11/2026");
    // Con OC el paquete no se arma por la vía de las hojas: solo se pide la base de OT.
    expect(armarPdf).not.toHaveBeenCalled();
  });

  it("la base de OT que usa el paquete es el PDF de todas las hojas de la cuenta, sin resumen", async () => {
    armarConOc.mockImplementation(async (_datos: unknown, deps: { construirBaseOt: (h: unknown[]) => Promise<Uint8Array> }) => {
      const base = await deps.construirBaseOt([hoja("a")]);
      return {
        partes: [{ hojas: [], resumen: [], pdf: new Blob([base as BlobPart]) }],
        resumenPdf: { titulo: "t", subtitulo: "", generado: "", filas: [] },
      };
    });

    await armarPreviaRapida(entrada({ conOc: true }));

    expect(armarPdf).toHaveBeenCalledTimes(1);
    expect(armarPdf.mock.calls[0]![1]).toEqual({ codigoCuenta: "JBR" });
  });

  it("si el paquete falla, el error llega tal cual", async () => {
    armarConOc.mockRejectedValue(new Error("sin memoria"));

    await expect(armarPreviaRapida(entrada({ conOc: true }))).rejects.toThrow("sin memoria");
  });
});
