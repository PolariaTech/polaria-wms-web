import { describe, expect, it } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { candidatasRapida, ordenarOvRapida, resumenRapida } from "./rapida-seleccion";

function ov(id: string, extra: Partial<OrdenVentaOperadorRow> = {}): OrdenVentaOperadorRow {
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

const ids = (rows: readonly OrdenVentaOperadorRow[]) => rows.map((row) => row.idOrdenVenta);

describe("ordenarOvRapida", () => {
  it("ordena por fecha, luego por cantidad de OT y al final por cliente", () => {
    const rows = [
      ov("a", { fechaEntrega: "2026-11-06", ordenesTrabajo: 3, comprador: "ABC" }),
      ov("b", { fechaEntrega: "2026-11-05", ordenesTrabajo: 5, comprador: "Zeta" }),
      ov("c", { fechaEntrega: "2026-11-06", ordenesTrabajo: 1, comprador: "Scaret" }),
      ov("d", { fechaEntrega: "2026-11-06", ordenesTrabajo: 3, comprador: "Álamo" }),
    ];

    expect(ids(ordenarOvRapida(rows))).toEqual(["b", "c", "a", "d"]);
  });

  it("a igual fecha, OT y cliente conserva el orden recibido", () => {
    const rows = [ov("x"), ov("y"), ov("z")];

    expect(ids(ordenarOvRapida(rows))).toEqual(["x", "y", "z"]);
  });

  it("no modifica la lista recibida", () => {
    const rows = [ov("a", { fechaEntrega: "2026-11-09" }), ov("b", { fechaEntrega: "2026-11-01" })];

    ordenarOvRapida(rows);

    expect(ids(rows)).toEqual(["a", "b"]);
  });
});

describe("candidatasRapida", () => {
  it("toma solo las confirmadas con entrega exactamente en la fecha elegida", () => {
    const rows = [
      ov("antes", { fechaEntrega: "2026-10-10" }),
      ov("igual", { fechaEntrega: "2026-11-05" }),
      ov("despues", { fechaEntrega: "2026-11-06" }),
    ];

    expect(ids(candidatasRapida(rows, "2026-11-05"))).toEqual(["igual"]);
  });

  it("deja fuera lo que ya salió de «confirmada»: alistamiento ya tiene surtido llenado", () => {
    const rows = [
      ov("alistamiento", { estado: "alistamiento" }),
      ov("alistada", { estado: "alistada" }),
      ov("porconfirmar", { estado: "por_confirmar" }),
      ov("ok"),
    ];

    expect(ids(candidatasRapida(rows, "2026-11-06"))).toEqual(["ok"]);
  });

  it("deja fuera las OV sin fecha de entrega", () => {
    const rows = [ov("sin", { fechaEntrega: null }), ov("con", { fechaEntrega: "2026-11-01" })];

    expect(ids(candidatasRapida(rows, "2026-11-01"))).toEqual(["con"]);
  });

  it("sin una fecha válida no hay candidatas", () => {
    expect(candidatasRapida([ov("a")], "")).toEqual([]);
    expect(candidatasRapida([ov("a")], "05/11/2026")).toEqual([]);
  });
});

describe("resumenRapida", () => {
  it("descarta las ya impresas y deja todas las OT de cada OV en orden", () => {
    const rows = [
      ov("a", { ordenesTrabajo: 3, fechaEntrega: "2026-11-05" }),
      ov("b", { ordenesTrabajo: 1, fechaEntrega: "2026-11-04" }),
      ov("c", { ordenesTrabajo: 2, fechaEntrega: "2026-11-04" }),
    ];

    const resumen = resumenRapida(rows, new Set(["c"]));

    expect(resumen.map((item) => item.row.idOrdenVenta)).toEqual(["b", "a"]);
    expect(resumen.map((item) => item.ots)).toEqual([[1], [1, 2, 3]]);
  });

  it("una OV sin OT registradas cuenta como una sola hoja", () => {
    const resumen = resumenRapida([ov("a", { ordenesTrabajo: 0 })], new Set());

    expect(resumen[0]?.ots).toEqual([1]);
  });

  it("si todo se imprimió antes, no queda nada", () => {
    expect(resumenRapida([ov("a")], new Set(["a"]))).toEqual([]);
  });
});
