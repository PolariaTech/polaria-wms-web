import { describe, expect, it } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { ResumenOvBatch } from "./batch-seleccion";
import {
  hojasPorEnviar,
  LIMITE_PARTE_BYTES,
  parteDeCadaOv,
  partirPaquete,
} from "./partir-paquete";

const MB = 1024 * 1024;

function ov(id: string, hojas: number): { item: ResumenOvBatch; hojas: OrdenTareaAlmacenPrintData[] } {
  return {
    item: {
      row: { idOrdenVenta: id, venta: `OV-${id}` } as OrdenVentaOperadorRow,
      ots: Array.from({ length: hojas }, (_, i) => i + 1),
    },
    hojas: Array.from({ length: hojas }, (_, i) => ({ idOrdenVenta: id, tareaIndex: i + 1 }) as OrdenTareaAlmacenPrintData),
  };
}

function armar(tamanos: Array<[string, number]>) {
  const ovs = tamanos.map(([id, n]) => ov(id, n));
  return { hojas: ovs.flatMap((o) => o.hojas), orden: ovs.map((o) => o.item) };
}

const ids = (parte: { resumen: ResumenOvBatch[] }) => parte.resumen.map((i) => i.row.idOrdenVenta);

describe("partirPaquete", () => {
  it("el límite es de 3 MB, lo que quedó documentado en REQ-186", () => {
    expect(LIMITE_PARTE_BYTES).toBe(3 * MB);
  });

  it("si cabe, va todo en una sola parte", () => {
    const { hojas, orden } = armar([["a", 2], ["b", 3]]);

    const partes = partirPaquete({ hojas, orden, bytesPorHoja: 10 * 1024 });

    expect(partes).toHaveLength(1);
    expect(partes[0]!.hojas).toHaveLength(5);
    expect(ids(partes[0]!)).toEqual(["a", "b"]);
  });

  it("sin peso medido no parte nada", () => {
    const { hojas, orden } = armar([["a", 500], ["b", 500]]);

    expect(partirPaquete({ hojas, orden, bytesPorHoja: null })).toHaveLength(1);
  });

  it("parte cuando el paquete pasa el límite y deja cada parte bajo él", () => {
    // 1 MB por hoja: el límite de 3 MB (con margen) deja 2 hojas por parte.
    const { hojas, orden } = armar([["a", 1], ["b", 1], ["c", 1], ["d", 1], ["e", 1]]);

    const partes = partirPaquete({ hojas, orden, bytesPorHoja: MB });

    expect(partes.map(ids)).toEqual([["a", "b"], ["c", "d"], ["e"]]);
    for (const parte of partes) expect(parte.hojas.length * MB).toBeLessThanOrEqual(LIMITE_PARTE_BYTES);
  });

  it("nunca corta una OV: sus hojas van juntas aunque eso deje una parte más corta", () => {
    // Capacidad ≈ 2,55 hojas de 1 MB: la OV «b» de 2 hojas no cabe junto a «a» (1) y pasa a la siguiente.
    const { hojas, orden } = armar([["a", 1], ["b", 2], ["c", 1]]);

    const partes = partirPaquete({ hojas, orden, bytesPorHoja: MB });

    expect(partes.map(ids)).toEqual([["a"], ["b"], ["c"]]);
    expect(partes[1]!.hojas.map((h) => h.idOrdenVenta)).toEqual(["b", "b"]);
  });

  it("conserva el orden de impresión entre partes y dentro de ellas", () => {
    const { hojas, orden } = armar([["z", 1], ["a", 1], ["m", 1], ["b", 1]]);

    const partes = partirPaquete({ hojas, orden, bytesPorHoja: MB });

    expect(partes.flatMap(ids)).toEqual(["z", "a", "m", "b"]);
    expect(partes.flatMap((p) => p.hojas.map((h) => h.idOrdenVenta))).toEqual(["z", "a", "m", "b"]);
  });

  it("una OV que sola pasa el límite va en su propia parte, sin dividirla", () => {
    const { hojas, orden } = armar([["a", 1], ["gigante", 5], ["b", 1]]);

    const partes = partirPaquete({ hojas, orden, bytesPorHoja: MB });

    expect(partes.map(ids)).toEqual([["a"], ["gigante"], ["b"]]);
    expect(partes[1]!.hojas).toHaveLength(5);
  });

  it("sin OV devuelve una parte vacía en vez de ninguna", () => {
    expect(partirPaquete({ hojas: [], orden: [], bytesPorHoja: MB })).toHaveLength(1);
  });
});

describe("partirPaquete con OC", () => {
  const extra = (bytes: number, paginas = 1) => ({ bytes, paginas });

  it("el peso de las OC cuenta: con hojas de OT livianas, unas OC pesadas igual parten el paquete", () => {
    // Hojas de 10 KB y OC de 1 MB cada una: caben 2 OV por parte (cap. 2,55 MB), no las 4.
    const { hojas, orden } = armar([["a", 1], ["b", 1], ["c", 1], ["d", 1]]);
    const extraPorOv = new Map([["a", extra(MB, 2)], ["b", extra(MB, 3)], ["c", extra(MB)], ["d", extra(MB)]]);

    const partes = partirPaquete({ hojas, orden, bytesPorHoja: 10 * 1024, extraPorOv });

    expect(partes.map(ids)).toEqual([["a", "b"], ["c", "d"]]);
  });

  it("cada parte lleva las páginas de OC de sus propias OV", () => {
    const { hojas, orden } = armar([["a", 1], ["b", 1], ["c", 1]]);
    const extraPorOv = new Map([["a", extra(MB, 2)], ["b", extra(MB, 3)], ["c", extra(MB, 4)]]);

    const partes = partirPaquete({ hojas, orden, bytesPorHoja: 10 * 1024, extraPorOv });

    expect(partes.map((p) => p.paginasExtra)).toEqual([5, 4]);
  });

  it("una OV sin OC suma cero páginas extra y no estorba", () => {
    const { hojas, orden } = armar([["a", 1], ["b", 1]]);

    const partes = partirPaquete({ hojas, orden, bytesPorHoja: 10 * 1024, extraPorOv: new Map([["a", extra(1000, 2)]]) });

    expect(partes).toHaveLength(1);
    expect(partes[0]!.paginasExtra).toBe(2);
  });

  it("nunca corta una OV: sus OC viajan con ella aunque pesen más que el límite", () => {
    const { hojas, orden } = armar([["a", 1], ["gigante", 1], ["b", 1]]);
    const extraPorOv = new Map([["gigante", extra(5 * MB, 9)]]);

    const partes = partirPaquete({ hojas, orden, bytesPorHoja: 10 * 1024, extraPorOv });

    expect(partes.map(ids)).toEqual([["a"], ["gigante"], ["b"]]);
    expect(partes[1]!.paginasExtra).toBe(9);
  });

  it("sin OC las partes no llevan el campo, como antes", () => {
    const { hojas, orden } = armar([["a", 1], ["b", 1], ["c", 1]]);

    const partes = partirPaquete({ hojas, orden, bytesPorHoja: MB });

    expect(partes.every((p) => !("paginasExtra" in p))).toBe(true);
  });
});

describe("parteDeCadaOv", () => {
  it("dice en qué parte (desde 1) sale cada OV", () => {
    const { hojas, orden } = armar([["a", 1], ["b", 1], ["c", 1]]);
    const partes = partirPaquete({ hojas, orden, bytesPorHoja: MB });

    expect([...parteDeCadaOv(partes)]).toEqual([["a", 1], ["b", 1], ["c", 2]]);
  });
});

describe("hojasPorEnviar", () => {
  const { hojas, orden } = armar([["a", 1], ["b", 1], ["c", 1]]);
  const partes = partirPaquete({ hojas, orden, bytesPorHoja: MB });

  it("al empezar suma todas las hojas y la portada de resumen", () => {
    expect(hojasPorEnviar(partes, 0, 1)).toBe(4);
  });

  it("las páginas de OC de cada parte también se cuentan como hojas por enviar", () => {
    // Dos partes: [a, b] con 2 hojas de OT y [c] con 1.
    const conOc = [
      { ...partes[0]!, paginasExtra: 4 },
      { ...partes[1]!, paginasExtra: 2 },
    ];

    // Todo: (2 + 4) + (1 + 2) y la portada de 1 página.
    expect(hojasPorEnviar(conOc, 0, 1)).toBe(10);
    // Retomando desde la segunda parte: solo (1 + 2), sin portada.
    expect(hojasPorEnviar(conOc, 1, 1)).toBe(3);
  });

  it("al retomar desde otra parte cuenta solo lo que falta, sin la portada", () => {
    expect(hojasPorEnviar(partes, 1, 1)).toBe(1);
    expect(hojasPorEnviar(partes, 2, 1)).toBe(0);
  });
});
