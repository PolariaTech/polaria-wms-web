import { PDFDocument } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { ResumenOvBatch } from "./batch-seleccion";
import { armarPaqueteConOc, dependenciasReales, type DependenciasPaquete } from "./armar-paquete-con-oc";
import type { OcPreparada } from "./preparar-oc";

const MB = 1024 * 1024;

async function pdfConAnchos(...anchos: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const ancho of anchos) doc.addPage([ancho, 100]);
  return doc.save();
}

/** Páginas del PDF de un envío, identificadas por su ancho. Las hojas del resumen son carta: 612 puntos. */
async function anchosDe(blob: Blob | undefined): Promise<number[]> {
  const doc = await PDFDocument.load(new Uint8Array(await blob!.arrayBuffer()));
  return doc.getPages().map((p) => Math.round(p.getWidth()));
}

function ov(id: string, ots = 1): ResumenOvBatch {
  return {
    row: { idOrdenVenta: id, venta: `OV-${id}`, comprador: `Cliente ${id}`, fechaEntrega: "2026-11-05" } as OrdenVentaOperadorRow,
    ots: Array.from({ length: ots }, (_, i) => i + 1),
  };
}

const hojaDe = (id: string, n: number) =>
  Array.from({ length: n }, (_, i) => ({ idOrdenVenta: id, tareaIndex: i + 1 }) as OrdenTareaAlmacenPrintData);

/** Bytes que no se comprimen: el PDF pesa de verdad lo que se pide. */
function aleatorio(largo: number): Uint8Array {
  const datos = new Uint8Array(largo);
  let semilla = 123456789;
  for (let i = 0; i < largo; i += 1) {
    semilla ^= semilla << 13;
    semilla ^= semilla >>> 17;
    semilla ^= semilla << 5;
    datos[i] = semilla & 0xff;
  }
  return datos;
}

async function ocDe(paginas: number, base: number, bytesExtra = 0, avisos: string[] = []): Promise<OcPreparada> {
  if (paginas === 0) return { documentos: [], paginas: 0, avisos };
  const doc = await PDFDocument.create();
  for (let i = 0; i < paginas; i += 1) doc.addPage([base + i, 100]);
  if (bytesExtra > 0) await doc.attach(aleatorio(bytesExtra), "relleno.bin", { mimeType: "application/octet-stream" });
  const bytes = await doc.save();
  return { documentos: [{ nombre: `oc-${base}.pdf`, bytes, paginas }], paginas, avisos };
}

/** `origen_archivos` con un PDF de ruta propia; `dependencias` lo reconoce por su nombre (sin `.pdf`). */
const origenDe = (...claves: string[]): string =>
  JSON.stringify(claves.map((clave) => ({ nombre: `${clave}.pdf`, path: `c/${clave}.pdf`, mime: "application/pdf" })));

async function dependencias(ocPorOrigen: Record<string, OcPreparada>, hojas: number): Promise<DependenciasPaquete> {
  // Cada hoja de OT es una página de ancho 100+n.
  const base = await pdfConAnchos(...Array.from({ length: hojas }, (_, i) => 101 + i));
  return {
    prepararOc: vi.fn(async (oc) => ocPorOrigen[oc.documentos[0]?.nombre.replace(/\.pdf$/, "") ?? ""] ?? { documentos: [], paginas: 0, avisos: [] }),
    construirBaseOt: vi.fn(async () => base),
  };
}

describe("dependenciasReales", () => {
  it("usa el generador de hojas que se le pasa y baja las OC con `prepararOcDeOv`", async () => {
    const construirBaseOt = vi.fn();

    const deps = dependenciasReales(construirBaseOt);

    expect(deps.construirBaseOt).toBe(construirBaseOt);
    // Una OV sin adjuntos no baja nada: resultado vacío, sin tocar la red.
    await expect(deps.prepararOc({ documentos: [], omitidos: [] })).resolves.toEqual({ documentos: [], paginas: 0, avisos: [] });
  });
});

describe("armarPaqueteConOc", () => {
  it("arma un solo envío: resumen primero, y por OV sus hojas de OT y detrás sus OC", async () => {
    const hojas = [...hojaDe("a", 2), ...hojaDe("b", 1)];
    const deps = await dependencias({ oa: await ocDe(2, 201), ob: await ocDe(1, 301) }, 3);

    const { partes, resumenPdf } = await armarPaqueteConOc(
      {
        hojas,
        resumen: [ov("a", 2), ov("b")],
        origenPorOv: new Map([["a", origenDe("oa")], ["b", origenDe("ob")]]),
        subtitulo: "Impresión rápida",
        generado: "Generado",
      },
      deps,
    );

    expect(partes).toHaveLength(1);
    const anchos = await anchosDe(partes[0]!.pdf);
    // 1 hoja de resumen (612) + OV a (101, 102, OC 201, 202) + OV b (103, OC 301).
    expect(anchos).toEqual([612, 101, 102, 201, 202, 103, 301]);
    expect(partes[0]!.paginasExtra).toBe(3);
    expect(resumenPdf.filas.map((f) => [f.venta, f.hojas, f.oc])).toEqual([
      ["OV-a", 2, 2],
      ["OV-b", 1, 1],
    ]);
  });

  it("una OV sin OC se anota en el resumen y no deja hueco entre las demás", async () => {
    const hojas = [...hojaDe("a", 1), ...hojaDe("b", 1)];
    const deps = await dependencias({ oa: await ocDe(1, 201) }, 2);

    const { partes, resumenPdf } = await armarPaqueteConOc(
      {
        hojas,
        resumen: [ov("a"), ov("b")],
        origenPorOv: new Map([["a", origenDe("oa")], ["b", origenDe("sin")]]),
        subtitulo: "x",
        generado: "y",
      },
      deps,
    );

    // Dos hojas de resumen (la tabla y la de notas) antes de todo lo demás.
    expect(await anchosDe(partes[0]!.pdf)).toEqual([612, 612, 101, 201, 102]);
    expect(resumenPdf.notas).toEqual(["OV-b: no tiene OC para imprimir (adjuntos HTML, PDF o Excel)."]);
  });

  it("lo que no se pudo bajar queda en las notas del resumen", async () => {
    const deps = await dependencias({ oa: await ocDe(0, 0, 0, ["lista.xlsx: el servidor respondió 404."]) }, 1);

    const { resumenPdf } = await armarPaqueteConOc(
      { hojas: hojaDe("a", 1), resumen: [ov("a")], origenPorOv: new Map([["a", origenDe("oa")]]), subtitulo: "x", generado: "y" },
      deps,
    );

    expect(resumenPdf.notas).toEqual(["OV-a: lista.xlsx: el servidor respondió 404."]);
  });

  it("parte el paquete cuando las OC pesan: cada envío con sus OV y las hojas que le tocan del PDF base", async () => {
    const hojas = [...hojaDe("a", 1), ...hojaDe("b", 1), ...hojaDe("c", 1)];
    // Cada OC reporta 1,2 MB: caben 2 OV por envío (capacidad ≈ 2,55 MB), no las 3.
    const deps = await dependencias(
      { oa: await ocDe(1, 201, 1.2 * MB), ob: await ocDe(1, 301, 1.2 * MB), oc: await ocDe(1, 401, 1.2 * MB) },
      3,
    );

    const { partes, resumenPdf } = await armarPaqueteConOc(
      {
        hojas,
        resumen: [ov("a"), ov("b"), ov("c")],
        origenPorOv: new Map([["a", origenDe("oa")], ["b", origenDe("ob")], ["c", origenDe("oc")]]),
        subtitulo: "Impresión rápida",
        generado: "y",
      },
      deps,
    );

    expect(partes.map((p) => p.resumen.map((i) => i.row.idOrdenVenta))).toEqual([["a", "b"], ["c"]]);
    // Envío 1: resumen + (a: OT 101, OC 201) + (b: OT 102, OC 301). Envío 2: sin resumen, solo la OV c.
    expect(await anchosDe(partes[0]!.pdf)).toEqual([612, 101, 201, 102, 301]);
    expect(await anchosDe(partes[1]!.pdf)).toEqual([103, 401]);
    expect(resumenPdf.subtitulo).toContain("en 2 partes");
    expect(resumenPdf.filas.map((f) => f.parte)).toEqual([1, 1, 2]);
  });

  it("avisa el avance: las OC que baja, la medida y el armado", async () => {
    const deps = await dependencias({}, 2);
    const mensajes: string[] = [];

    await armarPaqueteConOc(
      {
        hojas: [...hojaDe("a", 1), ...hojaDe("b", 1)],
        resumen: [ov("a"), ov("b")],
        origenPorOv: new Map(),
        subtitulo: "x",
        generado: "y",
        alProgreso: (t) => mensajes.push(t),
      },
      deps,
    );

    expect(mensajes).toContain("Bajando órdenes de compra: 2 de 2…");
    expect(mensajes.at(-2)).toBe("Midiendo el tamaño del paquete…");
    expect(mensajes.at(-1)).toBe("Armando el PDF…");
  });

  it("baja las OC de varias OV a la vez, pero no más de cuatro", async () => {
    const hojas = Array.from({ length: 10 }, (_, i) => hojaDe(`v${i}`, 1)).flat();
    let activas = 0;
    let maximo = 0;
    const base = await pdfConAnchos(...hojas.map((_, i) => 101 + i));
    const deps: DependenciasPaquete = {
      construirBaseOt: async () => base,
      prepararOc: async () => {
        activas += 1;
        maximo = Math.max(maximo, activas);
        await new Promise((listo) => setTimeout(listo, 5));
        activas -= 1;
        return { documentos: [], paginas: 0, avisos: [] };
      },
    };

    await armarPaqueteConOc(
      {
        hojas,
        resumen: hojas.map((h) => ov(h.idOrdenVenta!)),
        origenPorOv: new Map(),
        subtitulo: "x",
        generado: "y",
      },
      deps,
    );

    expect(maximo).toBeGreaterThan(1);
    expect(maximo).toBeLessThanOrEqual(4);
  });

  it("dos OV hermanas con los mismos documentos: salen una sola vez, tras la primera, y queda nota", async () => {
    const hojas = [...hojaDe("a", 1), ...hojaDe("b", 1)];
    const deps = await dependencias({ x1: await ocDe(2, 201) }, 2);
    const mismoOrigen = origenDe("x1", "x2");

    const { partes, resumenPdf } = await armarPaqueteConOc(
      {
        hojas,
        resumen: [ov("a"), ov("b")],
        origenPorOv: new Map([["a", mismoOrigen], ["b", mismoOrigen]]),
        subtitulo: "x",
        generado: "y",
      },
      deps,
    );

    // Resumen (tabla y notas), OV a (OT 101, sus 2 documentos) y OV b (OT 102, sin documentos).
    expect(await anchosDe(partes[0]!.pdf)).toEqual([612, 612, 101, 201, 202, 102]);
    expect(resumenPdf.notas).toEqual([
      "OV-b: x1.pdf: ya va impresa con OV-a.",
      "OV-b: x2.pdf: ya va impresa con OV-a.",
    ]);
  });

  it("dos hermanas cuyos PDF traen la OC en el nombre: cada una imprime solo el suyo", async () => {
    const hojas = [...hojaDe("a", 1), ...hojaDe("b", 1)];
    const deps = await dependencias({ "OC-140182": await ocDe(1, 201), "OC-140188": await ocDe(1, 301) }, 2);
    const mismoOrigen = origenDe("OC-140182", "OC-140188");
    const resumen = [ov("a"), ov("b")];
    resumen[0]!.row.occ = "4500140182";
    resumen[1]!.row.occ = "4500140188";

    const { partes, resumenPdf } = await armarPaqueteConOc(
      {
        hojas,
        resumen,
        origenPorOv: new Map([["a", mismoOrigen], ["b", mismoOrigen]]),
        subtitulo: "x",
        generado: "y",
      },
      deps,
    );

    expect(await anchosDe(partes[0]!.pdf)).toEqual([612, 101, 201, 102, 301]);
    expect(resumenPdf.notas).toBeUndefined();
  });
});
