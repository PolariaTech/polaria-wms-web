import { describe, expect, it } from "vitest";
import { avisoDeOcSinImprimir } from "./aviso-oc";
import type { PreviaBatch } from "./utilidades-batch";

type Fila = { venta: string; oc?: number };

const conOc = (filas: Fila[], notas?: string[]): Pick<PreviaBatch, "resumenPdf" | "partes"> => ({
  resumenPdf: {
    titulo: "Resumen",
    subtitulo: "x",
    generado: "y",
    filas: filas.map((f) => ({ cliente: "Hotel", entrega: "01/11/2026", ot: 1, hojas: 1, ...f })),
    ...(notas ? { notas } : {}),
  },
  partes: [{ hojas: [], resumen: [], pdf: new Blob(["pdf"]) }],
});

describe("avisoDeOcSinImprimir", () => {
  it("sin OC marcadas (los envíos no traen PDF armado) no avisa de nada", () => {
    const previa = { ...conOc([{ venta: "OV-1" }]), partes: [{ hojas: [], resumen: [] }] };

    expect(avisoDeOcSinImprimir(previa)).toBeNull();
  });

  it("sin resumen no avisa de nada", () => {
    expect(avisoDeOcSinImprimir({ partes: [] })).toBeNull();
  });

  it("si todas las OV traen su OC no avisa de nada", () => {
    expect(avisoDeOcSinImprimir(conOc([{ venta: "OV-1", oc: 2 }, { venta: "OV-2", oc: 1 }]))).toBeNull();
  });

  it("nombra las OV sin OC e indica que sus órdenes de tarea sí salen", () => {
    const aviso = avisoDeOcSinImprimir(
      conOc(
        [{ venta: "OV-1", oc: 1 }, { venta: "OV-2" }, { venta: "OV-3" }],
        ["OV-2: no tiene OC para imprimir (adjuntos HTML, PDF o Excel).", "OV-3: no tiene OC para imprimir (adjuntos HTML, PDF o Excel)."],
      ),
    );

    expect(aviso?.titulo).toBe("2 de 3 OV no tienen OC para imprimir.");
    expect(aviso?.detalle).toContain("OV-2, OV-3.");
    expect(aviso?.detalle).toContain("Sus órdenes de tarea sí salen.");
    expect(aviso?.detalle).toContain("hoja de notas del resumen");
  });

  it("con una sola OV sin OC habla en singular", () => {
    const aviso = avisoDeOcSinImprimir(conOc([{ venta: "OV-1" }], ["OV-1: no tiene OC para imprimir (adjuntos HTML, PDF o Excel)."]));

    expect(aviso?.titulo).toBe("1 de 1 OV no tiene OC para imprimir.");
  });

  it("nombra solo las primeras cinco y cuenta el resto", () => {
    const filas = Array.from({ length: 8 }, (_, i) => ({ venta: `OV-${i + 1}` }));

    const aviso = avisoDeOcSinImprimir(conOc(filas));

    expect(aviso?.titulo).toBe("8 de 8 OV no tienen OC para imprimir.");
    expect(aviso?.detalle).toContain("OV-1, OV-2, OV-3, OV-4, OV-5 y 3 más.");
    expect(aviso?.detalle).not.toContain("OV-6");
  });

  it("cuenta aparte los archivos que no se pudieron convertir", () => {
    const aviso = avisoDeOcSinImprimir(
      conOc(
        [{ venta: "OV-1" }, { venta: "OV-2", oc: 1 }],
        ["OV-1: lista.xlsx: el servidor respondió 404.", "OV-2: foto.html: quedó en blanco al convertirlo."],
      ),
    );

    expect(aviso?.titulo).toBe("1 de 2 OV no tiene OC para imprimir.");
    expect(aviso?.detalle).toContain("2 archivos de OC no se pudieron convertir.");
  });

  it("si todas tienen OC pero algún archivo falló, avisa solo del archivo", () => {
    const aviso = avisoDeOcSinImprimir(conOc([{ venta: "OV-1", oc: 1 }], ["OV-1: lista.xlsx: el servidor respondió 404."]));

    expect(aviso?.titulo).toBe("Hay 1 archivo de OC sin imprimir.");
    expect(aviso?.detalle).toBe("El detalle está en la hoja de notas del resumen.");
  });
});
