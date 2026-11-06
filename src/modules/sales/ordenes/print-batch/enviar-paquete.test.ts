import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { ResumenImpresionPdf } from "../print/render-resumen-impresion-pdf";

const imprimirPdf = vi.fn();
const armarBlob = vi.fn();
const numerar = vi.fn();
const registrar = vi.fn();

vi.mock("../print/download-orden-tarea-almacen-pdf", () => ({
  printOrdenTareaAlmacenLandscape: (...args: unknown[]) => imprimirPdf(...args),
  buildOrdenTareaAlmacenLandscapePdfBlob: (...args: unknown[]) => armarBlob(...args),
}));
vi.mock("../print/numerar-hojas-pdf", () => ({
  numerarBlobPdf: (...args: unknown[]) => numerar(...args),
}));
const imprimirListo = vi.fn();
vi.mock("./imprimir-pdf-listo", () => ({
  imprimirPdfListo: (...args: unknown[]) => imprimirListo(...args),
}));
vi.mock("./registrar-impresion-batch", () => ({
  registrarImpresionBatch: (...args: unknown[]) => registrar(...args),
}));

import { enviarPaquete, esperaEntrePartes, mensajeDeFallo, partesDe } from "./enviar-paquete";
import type { ParteEnvio } from "./partir-paquete";
import type { PreviaBatch } from "./utilidades-batch";

function parte(id: string): ParteEnvio {
  return {
    hojas: [{ idOrdenVenta: id } as OrdenTareaAlmacenPrintData],
    resumen: [{ row: { idOrdenVenta: id, venta: `OV-${id}` } as OrdenVentaOperadorRow, ots: [1] }],
  };
}

const RESUMEN = { titulo: "Resumen", subtitulo: "", generado: "", filas: [] } as ResumenImpresionPdf;

function previa(partes?: ParteEnvio[]): PreviaBatch {
  const todas = partes ?? [parte("a")];
  return {
    blob: new Blob(["x"]),
    hojas: todas.flatMap((p) => p.hojas),
    resumen: todas.flatMap((p) => p.resumen),
    nombreArchivo: "x.pdf",
    resumenPdf: RESUMEN,
    partes,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  imprimirPdf.mockResolvedValue({ queue: { kind: "unknown" }, impresora: "Brother" });
  imprimirListo.mockResolvedValue({ queue: { kind: "unknown" }, impresora: "Brother" });
  armarBlob.mockImplementation(async () => ({ blob: new Blob(["armado"]), filename: "x.pdf" }));
  // El PDF numerado se reconoce por la etiqueta de parte con la que se numeró.
  numerar.mockImplementation(async (_blob: Blob, parte?: string) => new Blob([`numerado ${parte ?? "sin parte"}`]));
});

describe("esperaEntrePartes", () => {
  it("la impresora por correo o Epson Connect espera un minuto entre partes", () => {
    expect(esperaEntrePartes("email")).toBe(60_000);
    expect(esperaEntrePartes("epson_connect")).toBe(60_000);
  });

  it("IPP y QZ Tray encolan por su cuenta: no esperan", () => {
    for (const modo of ["ipp", "agente", "sistema_local", "raw_9100"]) {
      expect(esperaEntrePartes(modo)).toBe(0);
    }
  });

  it("sin saber el modo espera, que es lo seguro", () => {
    expect(esperaEntrePartes(null)).toBe(60_000);
    expect(esperaEntrePartes(undefined)).toBe(60_000);
  });
});

describe("mensajeDeFallo", () => {
  it("en un solo envío da el motivo tal cual", () => {
    expect(mensajeDeFallo(new Error("SMTP caído"), 0, 1)).toBe("SMTP caído");
  });

  it("en partes dice cuántas salieron, cuál falló y que reintentar no repite las anteriores", () => {
    const mensaje = mensajeDeFallo(new Error("SMTP caído"), 2, 5);

    expect(mensaje).toContain("Salieron 2 de 5 partes. Falló la parte 3: SMTP caído");
    expect(mensaje).toContain("sin repetir las que ya salieron");
  });

  it("un error que no es Error cae al mensaje genérico", () => {
    expect(mensajeDeFallo("raro", 0, 1)).toBe("No se pudo enviar a la impresora.");
  });
});

describe("partesDe", () => {
  it("sin partición el paquete entero es una sola parte", () => {
    const p = previa();

    expect(partesDe(p)).toHaveLength(1);
    expect(partesDe(p)[0]!.hojas).toBe(p.hojas);
  });
});

describe("enviarPaquete", () => {
  it("un solo envío: arma el PDF con el resumen, numera sus hojas sin etiqueta de parte y registra el log", async () => {
    const resultado = await enviarPaquete({ previa: previa(), codigoCuenta: "JBR", desde: 0, esperaMs: 0 });

    expect(armarBlob).toHaveBeenCalledTimes(1);
    expect(armarBlob.mock.calls[0]![1]).toEqual({ codigoCuenta: "JBR", resumen: RESUMEN });
    expect(numerar.mock.calls[0]![1]).toBeUndefined();
    expect(imprimirListo).toHaveBeenCalledTimes(1);
    expect(imprimirListo.mock.calls[0]![1]).toEqual({ codigoCuenta: "JBR", nombreTrabajo: "OV OV-a" });
    expect(imprimirPdf).not.toHaveBeenCalled();
    expect(registrar).toHaveBeenCalledTimes(1);
    expect(resultado.siguiente).toBe(1);
  });

  it("lo que se manda es el PDF ya numerado, no el que armó el generador de hojas", async () => {
    await enviarPaquete({ previa: previa(), codigoCuenta: "JBR", desde: 0, esperaMs: 0 });

    const mandado = imprimirListo.mock.calls[0]![0] as Blob;
    expect(await mandado.text()).toBe("numerado sin parte");
  });

  it("en partes: el resumen va solo en la primera y cada correo numera sus hojas con su parte", async () => {
    const p = previa([parte("a"), parte("b"), parte("c")]);

    await enviarPaquete({ previa: p, codigoCuenta: "JBR", desde: 0, esperaMs: 0 });

    expect(armarBlob.mock.calls.map((c) => c[1].resumen)).toEqual([RESUMEN, undefined, undefined]);
    expect(numerar.mock.calls.map((c) => c[1])).toEqual(["1/3", "2/3", "3/3"]);
    expect(imprimirListo.mock.calls.map((c) => c[1].nombreTrabajo)).toEqual(["OV OV-a (1/3)", "OV OV-b (2/3)", "OV OV-c (3/3)"]);
  });

  it("la impresión detallada (sin resumen) sigue por su camino de siempre y no numera las hojas", async () => {
    const detallada = { ...previa(), resumenPdf: undefined };

    await enviarPaquete({ previa: detallada, codigoCuenta: "JBR", desde: 0, esperaMs: 0 });

    expect(imprimirPdf).toHaveBeenCalledTimes(1);
    expect(imprimirPdf.mock.calls[0]![1]).toEqual({ codigoCuenta: "JBR", resumen: undefined, etiquetaParte: undefined });
    expect(armarBlob).not.toHaveBeenCalled();
    expect(numerar).not.toHaveBeenCalled();
    expect(imprimirListo).not.toHaveBeenCalled();
  });

  it("registra el log de cada parte con sus propias OV, no con las de todo el paquete", async () => {
    const p = previa([parte("a"), parte("b")]);

    await enviarPaquete({ previa: p, codigoCuenta: "JBR", desde: 0, esperaMs: 0 });

    expect(registrar.mock.calls.map((c) => c[0].previa.resumen.map((i: { row: { idOrdenVenta: string } }) => i.row.idOrdenVenta))).toEqual([["a"], ["b"]]);
  });

  it("si una parte falla no registra como impresas las OV de esa parte ni las siguientes", async () => {
    imprimirListo.mockResolvedValueOnce({ queue: { kind: "unknown" }, impresora: "B" }).mockRejectedValueOnce(new Error("SMTP caído"));
    const p = previa([parte("a"), parte("b"), parte("c")]);

    const resultado = await enviarPaquete({ previa: p, codigoCuenta: "JBR", desde: 0, esperaMs: 0 });

    expect(registrar).toHaveBeenCalledTimes(1);
    expect(registrar.mock.calls[0]![0].previa.resumen[0].row.idOrdenVenta).toBe("a");
    expect(resultado.siguiente).toBe(1);
    expect(resultado.error).toEqual(new Error("SMTP caído"));
  });

  it("una parte con el PDF ya armado (con OC) se manda tal cual, sin reconstruirla desde las hojas", async () => {
    imprimirListo.mockResolvedValue({ queue: { kind: "unknown" }, impresora: "Brother" });
    const pdf = new Blob(["%PDF"]);
    const p = previa([{ ...parte("a"), pdf }, { ...parte("b"), pdf }]);

    await enviarPaquete({ previa: p, codigoCuenta: "JBR", desde: 0, esperaMs: 0 });

    expect(imprimirPdf).not.toHaveBeenCalled();
    expect(imprimirListo.mock.calls.map((c) => c[1].nombreTrabajo)).toEqual(["OV OV-a (1/2)", "OV OV-b (2/2)"]);
    expect(imprimirListo.mock.calls[0]![0]).toBe(pdf);
    // El log de «impreso» se escribe igual, por parte.
    expect(registrar).toHaveBeenCalledTimes(2);
  });

  it("en un solo envío con PDF armado el nombre del trabajo no lleva número de parte", async () => {
    imprimirListo.mockResolvedValue({ queue: { kind: "unknown" }, impresora: "Brother" });

    await enviarPaquete({ previa: previa([{ ...parte("a"), pdf: new Blob(["%PDF"]) }]), codigoCuenta: "JBR", desde: 0, esperaMs: 0 });

    expect(imprimirListo.mock.calls[0]![1].nombreTrabajo).toBe("OV OV-a");
  });

  it("al reintentar desde la parte que falló, la etiqueta sigue siendo la de su lugar y no lleva el resumen", async () => {
    const p = previa([parte("a"), parte("b"), parte("c")]);

    await enviarPaquete({ previa: p, codigoCuenta: "JBR", desde: 1, esperaMs: 0 });

    expect(numerar.mock.calls.map((c) => c[1])).toEqual(["2/3", "3/3"]);
    expect(armarBlob.mock.calls.every((c) => c[1].resumen === undefined)).toBe(true);
  });
});
