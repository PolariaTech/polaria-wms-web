import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

const getOrdenVentaDetalle = vi.fn();
const mapSheets = vi.fn();
const listCapturas = vi.fn();
const applyCapturas = vi.fn();

vi.mock("../../shared/services/sales.service", () => ({
  getOrdenVentaDetalle: (...args: unknown[]) => getOrdenVentaDetalle(...args),
}));
vi.mock("../print/map-orden-tarea-almacen", () => ({
  mapOrdenVentaToAlmacenPrintSheets: (...args: unknown[]) => mapSheets(...args),
}));
vi.mock("../surtido/list-orden-surtido-capturas.client", () => ({
  listOrdenSurtidoCapturasClient: (...args: unknown[]) => listCapturas(...args),
}));
vi.mock("../surtido/apply-surtido-to-print", () => ({
  applySurtidoCapturasToPrintSheets: (...args: unknown[]) => applyCapturas(...args),
}));

import { cargarCentrosConsumo, cargarHojasBatch } from "./cargar-hojas-batch";

function row(id: string): OrdenVentaOperadorRow {
  return { idOrdenVenta: id, venta: `OV-${id}`, ordenesTrabajo: 3 } as OrdenVentaOperadorRow;
}

function hoja(folio: string, tareaIndex: number): OrdenTareaAlmacenPrintData {
  return { folio, tareaIndex, fechaEntrega: "", horaEntrega: "" } as OrdenTareaAlmacenPrintData;
}

const runScoped = <T>(tarea: () => Promise<T>) => tarea();

beforeEach(() => {
  vi.clearAllMocks();
  getOrdenVentaDetalle.mockResolvedValue({ id_orden_venta: "x" });
  listCapturas.mockResolvedValue([]);
  applyCapturas.mockImplementation((hojas: unknown) => hojas);
  mapSheets.mockImplementation(({ listRow }: { listRow: OrdenVentaOperadorRow }) => [
    hoja(listRow.venta, 1),
    hoja(listRow.venta, 2),
    hoja(listRow.venta, 3),
  ]);
});

describe("cargarCentrosConsumo", () => {
  it("devuelve el centro de consumo de cada OT y omite las que no lo tienen", async () => {
    mapSheets.mockReturnValue([
      { ...hoja("OV-a", 1), centroConsumo: "Cocina norte" },
      { ...hoja("OV-a", 1), centroConsumo: "Otro (segunda hoja de la misma OT)" },
      { ...hoja("OV-a", 2), centroConsumo: "  " },
      { ...hoja("OV-a", 3), centroConsumo: "Banquetes" },
    ]);
    const centros = await cargarCentrosConsumo({
      codigoCuenta: "JBR",
      row: row("a"),
      zonaHoraria: "America/Bogota",
      runScoped,
    });
    expect(centros).toEqual({ 1: "Cocina norte", 3: "Banquetes" });
  });

  it("propaga el error si no se puede leer el detalle", async () => {
    getOrdenVentaDetalle.mockRejectedValueOnce(new Error("red"));
    await expect(
      cargarCentrosConsumo({
        codigoCuenta: "JBR",
        row: row("a"),
        zonaHoraria: "America/Bogota",
        runScoped,
      }),
    ).rejects.toThrow("red");
  });
});

describe("cargarHojasBatch", () => {
  it("devuelve solo las OT elegidas y respeta el orden de la lista", async () => {
    const hojas = await cargarHojasBatch({
      codigoCuenta: "JBR",
      zonaHoraria: "America/Bogota",
      runScoped,
      resumen: [
        { row: row("a"), ots: [2] },
        { row: row("b"), ots: [1, 3] },
      ],
    });
    expect(hojas.map((h) => `${h.folio}#${h.tareaIndex}`)).toEqual([
      "OV-a#2",
      "OV-b#1",
      "OV-b#3",
    ]);
  });

  it("ordena siempre las hojas por fecha y hora de entrega, sin importar el orden de la lista", async () => {
    const entregas: Record<string, [string, string]> = {
      "OV-tarde": ["06/11/2026", "14:00 – 16:00"],
      "OV-manana": ["06/11/2026", "06:00 – 08:00"],
      "OV-ayer": ["05/11/2026", ""],
    };
    mapSheets.mockImplementation(({ listRow }: { listRow: OrdenVentaOperadorRow }) => {
      const [fechaEntrega, horaEntrega] = entregas[listRow.venta]!;
      return [{ ...hoja(listRow.venta, 1), fechaEntrega, horaEntrega }];
    });
    const hojas = await cargarHojasBatch({
      codigoCuenta: "JBR",
      zonaHoraria: "America/Bogota",
      runScoped,
      resumen: [
        { row: { ...row("t"), venta: "OV-tarde" }, ots: [1] },
        { row: { ...row("m"), venta: "OV-manana" }, ots: [1] },
        { row: { ...row("y"), venta: "OV-ayer" }, ots: [1] },
      ],
    });
    expect(hojas.map((h) => h.folio)).toEqual(["OV-ayer", "OV-manana", "OV-tarde"]);
  });

  it("con orden «resumen» conserva el orden recibido (el que impone la impresión rápida)", async () => {
    const entregas: Record<string, [string, string]> = {
      "OV-tarde": ["06/11/2026", "14:00 – 16:00"],
      "OV-ayer": ["05/11/2026", ""],
    };
    mapSheets.mockImplementation(({ listRow }: { listRow: OrdenVentaOperadorRow }) => {
      const [fechaEntrega, horaEntrega] = entregas[listRow.venta]!;
      return [{ ...hoja(listRow.venta, 1), fechaEntrega, horaEntrega }];
    });
    const hojas = await cargarHojasBatch({
      codigoCuenta: "JBR",
      zonaHoraria: "America/Bogota",
      runScoped,
      orden: "resumen",
      resumen: [
        { row: { ...row("t"), venta: "OV-tarde" }, ots: [1] },
        { row: { ...row("y"), venta: "OV-ayer" }, ots: [1] },
      ],
    });
    expect(hojas.map((h) => h.folio)).toEqual(["OV-tarde", "OV-ayer"]);
  });

  it("entrega el `origen_archivos` de cada OV al leer su detalle, sin pedirlo dos veces", async () => {
    getOrdenVentaDetalle.mockImplementation(async ({ idOrdenVenta }: { idOrdenVenta: string }) => ({
      origen_archivos: idOrdenVenta === "a" ? '[{"nombre":"pedido.pdf"}]' : null,
    }));
    const vistos: Array<[string, string | null | undefined]> = [];

    await cargarHojasBatch({
      codigoCuenta: "JBR",
      zonaHoraria: "America/Bogota",
      runScoped,
      resumen: [
        { row: row("a"), ots: [1] },
        { row: row("b"), ots: [1] },
      ],
      alLeerDetalle: (id, origen) => vistos.push([id, origen]),
    });

    expect(vistos.sort()).toEqual([
      ["a", '[{"nombre":"pedido.pdf"}]'],
      ["b", null],
    ]);
    expect(getOrdenVentaDetalle).toHaveBeenCalledTimes(2);
  });

  it("avisa el progreso por cada OV leída", async () => {
    const onProgreso = vi.fn();
    await cargarHojasBatch({
      codigoCuenta: "JBR",
      zonaHoraria: "America/Bogota",
      runScoped,
      onProgreso,
      resumen: [
        { row: row("a"), ots: [1] },
        { row: row("b"), ots: [1] },
      ],
    });
    expect(onProgreso).toHaveBeenCalledTimes(2);
    expect(onProgreso).toHaveBeenLastCalledWith(2, 2);
  });

  it("falla con el folio de la OV si no se puede leer el detalle (no imprime hojas vacías)", async () => {
    getOrdenVentaDetalle.mockRejectedValueOnce(new Error("red"));
    await expect(
      cargarHojasBatch({
        codigoCuenta: "JBR",
        zonaHoraria: "America/Bogota",
        runScoped,
        resumen: [{ row: row("a"), ots: [1] }],
      }),
    ).rejects.toThrow("No se pudo leer OV-a");
  });

  it("si fallan las fotos de surtido imprime la hoja base", async () => {
    listCapturas.mockRejectedValue(new Error("sin permiso"));
    const hojas = await cargarHojasBatch({
      codigoCuenta: "JBR",
      zonaHoraria: "America/Bogota",
      runScoped,
      resumen: [{ row: row("a"), ots: [1] }],
    });
    expect(hojas).toHaveLength(1);
    expect(applyCapturas).not.toHaveBeenCalled();
  });

  it("sin nada elegido no consulta nada", async () => {
    const hojas = await cargarHojasBatch({
      codigoCuenta: "JBR",
      zonaHoraria: "America/Bogota",
      runScoped,
      resumen: [],
    });
    expect(hojas).toEqual([]);
    expect(getOrdenVentaDetalle).not.toHaveBeenCalled();
  });
});
