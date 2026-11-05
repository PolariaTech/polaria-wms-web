import { describe, expect, it } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import {
  alternarOt,
  alternarOv,
  clientesDeOv,
  contarSeleccion,
  diaEntregaDeOv,
  estadoSeleccionOv,
  etiquetaDiaEntrega,
  ordenarOvPorEntrega,
  FILTROS_BATCH_INICIALES,
  filtrarHojasElegidas,
  filtrarOvBatch,
  puedeImprimirEnBatch,
  quitarGrupo,
  resumenSeleccion,
  seleccionarGrupo,
  totalOtDeOv,
  type SeleccionBatch,
} from "./batch-seleccion";

function ov(
  id: string,
  extra: Partial<OrdenVentaOperadorRow> = {},
): OrdenVentaOperadorRow {
  return {
    idOrdenVenta: id,
    venta: `OV-${id}`,
    occ: "",
    occTodas: [],
    cuenta: "JBR",
    comprador: "Hotel Sol",
    productos: "—",
    cantidadKg: 0,
    total: 0,
    estado: "confirmada",
    fecha: "2026-11-01",
    fechaEntrega: "2026-11-06",
    ordenesTrabajo: 1,
    destino: "—",
    idBodega: "b1",
    idBodegaDestino: null,
    slaStatus: "en_tiempo",
    alertaStatus: "ok",
    minutosEnEstado: 0,
    slaMinutos: 60,
    alertaMinutos: 45,
    ...extra,
  };
}

const VACIA: SeleccionBatch = new Map();

describe("puedeImprimirEnBatch", () => {
  it.each(["confirmada", "alistamiento"] as const)("deja imprimir en %s", (estado) => {
    expect(puedeImprimirEnBatch(estado)).toBe(true);
  });

  it.each(["por_confirmar", "alistada", "revisada", "facturada", "despachada", "cancelada"] as const)(
    "no deja imprimir en %s",
    (estado) => {
      expect(puedeImprimirEnBatch(estado)).toBe(false);
    },
  );
});

describe("filtrarOvBatch", () => {
  const rows = [
    ov("a", { comprador: "Hotel Sol", ordenesTrabajo: 1, occ: "OC-100" }),
    ov("b", { comprador: "Hotel Luna", ordenesTrabajo: 3, fechaEntrega: "2026-11-07" }),
    ov("c", { comprador: "Hotel Sol", ordenesTrabajo: 0, fechaEntrega: null }),
  ];

  it("sin filtros devuelve todas", () => {
    expect(filtrarOvBatch(rows, FILTROS_BATCH_INICIALES)).toHaveLength(3);
  });

  it("filtra por cliente exacto", () => {
    const res = filtrarOvBatch(rows, { ...FILTROS_BATCH_INICIALES, cliente: "Hotel Luna" });
    expect(res.map((r) => r.idOrdenVenta)).toEqual(["b"]);
  });

  it("filtra por fecha de entrega y excluye las que no tienen fecha", () => {
    const res = filtrarOvBatch(rows, { ...FILTROS_BATCH_INICIALES, fechaEntrega: "2026-11-06" });
    expect(res.map((r) => r.idOrdenVenta)).toEqual(["a"]);
  });

  it("separa OV de una OT de OV con varias OT (sin OT cuenta como una)", () => {
    const una = filtrarOvBatch(rows, { ...FILTROS_BATCH_INICIALES, tipo: "una_ot" });
    const varias = filtrarOvBatch(rows, { ...FILTROS_BATCH_INICIALES, tipo: "varias_ot" });
    expect(una.map((r) => r.idOrdenVenta)).toEqual(["a", "c"]);
    expect(varias.map((r) => r.idOrdenVenta)).toEqual(["b"]);
  });

  it("busca por folio, cliente u OCC sin importar mayúsculas", () => {
    const res = filtrarOvBatch(rows, { ...FILTROS_BATCH_INICIALES, texto: " oc-100 " });
    expect(res.map((r) => r.idOrdenVenta)).toEqual(["a"]);
  });
});

describe("orden de la lista por entrega", () => {
  it("ordena por día de entrega, deja las OV sin fecha al final y conserva el orden a igual día", () => {
    const res = ordenarOvPorEntrega([
      ov("sin", { fechaEntrega: null }),
      ov("tarde", { fechaEntrega: "2026-11-08" }),
      ov("a", { fechaEntrega: "2026-11-06" }),
      ov("b", { fechaEntrega: "2026-11-06" }),
      ov("raro", { fechaEntrega: "pronto" }),
    ]);
    expect(res.map((r) => r.idOrdenVenta)).toEqual(["a", "b", "tarde", "sin", "raro"]);
  });

  it("diaEntregaDeOv ignora la hora y los valores que no son fecha", () => {
    expect(diaEntregaDeOv(ov("x", { fechaEntrega: "2026-11-06T14:00:00Z" }))).toBe("2026-11-06");
    expect(diaEntregaDeOv(ov("x", { fechaEntrega: "06/11/2026" }))).toBe("");
  });

  it("etiqueta el día en español y avisa cuando no hay fecha", () => {
    expect(etiquetaDiaEntrega("2026-11-05")).toBe("Jueves, 5 de noviembre");
    expect(etiquetaDiaEntrega("")).toBe("Sin fecha de entrega");
  });
});

describe("clientesDeOv", () => {
  it("devuelve nombres únicos ordenados y omite vacíos", () => {
    const res = clientesDeOv([
      ov("a", { comprador: "Zeta" }),
      ov("b", { comprador: "Alfa" }),
      ov("c", { comprador: "Zeta" }),
      ov("d", { comprador: "—" }),
    ]);
    expect(res).toEqual(["Alfa", "Zeta"]);
  });
});

describe("selección por OT, por OV y por grupo", () => {
  const varias = ov("x", { ordenesTrabajo: 3 });

  it("totalOtDeOv nunca baja de 1", () => {
    expect(totalOtDeOv(ov("z", { ordenesTrabajo: 0 }))).toBe(1);
    expect(totalOtDeOv(varias)).toBe(3);
  });

  it("una OT suelta deja la OV en parcial y completar las demás la pasa a todas", () => {
    let sel = alternarOt(VACIA, varias, 2);
    expect(estadoSeleccionOv(sel, varias)).toBe("parcial");
    sel = alternarOt(alternarOt(sel, varias, 1), varias, 3);
    expect(estadoSeleccionOv(sel, varias)).toBe("todas");
  });

  it("desmarcar la última OT quita la OV de la selección", () => {
    const sel = alternarOt(alternarOt(VACIA, varias, 2), varias, 2);
    expect(sel.has("x")).toBe(false);
    expect(estadoSeleccionOv(sel, varias)).toBe("ninguna");
  });

  it("alternarOv marca todas, y desde parcial también completa", () => {
    const parcial = alternarOt(VACIA, varias, 1);
    expect(estadoSeleccionOv(alternarOv(parcial, varias), varias)).toBe("todas");
    expect(estadoSeleccionOv(alternarOv(alternarOv(VACIA, varias), varias), varias)).toBe(
      "ninguna",
    );
  });

  it("no muta la selección anterior", () => {
    const antes = alternarOt(VACIA, varias, 1);
    alternarOt(antes, varias, 2);
    expect([...(antes.get("x") ?? [])]).toEqual([1]);
  });

  it("seleccionarGrupo y quitarGrupo marcan y desmarcan varias OV a la vez", () => {
    const b = ov("b", { ordenesTrabajo: 2 });
    const sel = seleccionarGrupo(VACIA, [varias, b]);
    expect(contarSeleccion(resumenSeleccion(sel, [varias, b]))).toEqual({ ov: 2, ot: 5 });
    const sinB = quitarGrupo(sel, [b]);
    expect(contarSeleccion(resumenSeleccion(sinB, [varias, b]))).toEqual({ ov: 1, ot: 3 });
  });
});

describe("resumenSeleccion", () => {
  it("respeta el orden de la lista y descarta OV que ya no existen u OT fuera de rango", () => {
    const a = ov("a", { ordenesTrabajo: 2 });
    const b = ov("b", { ordenesTrabajo: 1 });
    const sel: SeleccionBatch = new Map([
      ["b", new Set([1])],
      ["a", new Set([2, 1, 9])],
      ["fantasma", new Set([1])],
    ]);
    const res = resumenSeleccion(sel, [a, b]);
    expect(res.map((item) => item.row.idOrdenVenta)).toEqual(["a", "b"]);
    expect(res[0]!.ots).toEqual([1, 2]);
  });
});

describe("filtrarHojasElegidas", () => {
  function hoja(tareaIndex: number | undefined, ordenTrabajo: string): OrdenTareaAlmacenPrintData {
    return {
      tareaIndex,
      folio: "OV-1",
      creada: "",
      impresa: "",
      cliente: "",
      centroConsumo: "",
      numeroOrdenCliente: "",
      ordenTrabajo,
      fechaEntrega: "",
      horaEntrega: "",
      direccionEntrega: "",
      notasGenerales: "",
      lineas: [],
    };
  }

  it("conserva todas las hojas de una OT elegida y quita las demás", () => {
    const hojas = [hoja(1, "1-1/3"), hoja(1, "1-2/3"), hoja(2, "2/3"), hoja(3, "3/3")];
    const res = filtrarHojasElegidas(hojas, [1, 3]);
    expect(res.map((h) => h.ordenTrabajo)).toEqual(["1-1/3", "1-2/3", "3/3"]);
  });

  it("una hoja sin índice cuenta como la OT 1", () => {
    expect(filtrarHojasElegidas([hoja(undefined, "1/1")], [1])).toHaveLength(1);
  });
});
