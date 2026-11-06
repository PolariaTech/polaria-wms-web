import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { SeleccionBatch } from "./batch-seleccion";
import { ImpresionBatchLista } from "./ImpresionBatchLista";

function ov(
  id: string,
  extra: Partial<OrdenVentaOperadorRow> = {},
): OrdenVentaOperadorRow {
  return {
    idOrdenVenta: id,
    venta: `OV-${id}`,
    occ: "OC-77",
    occTodas: ["OC-77"],
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

function montar(
  rows: OrdenVentaOperadorRow[],
  extra: Partial<Parameters<typeof ImpresionBatchLista>[0]> = {},
) {
  const props = {
    rows,
    seleccion: VACIA,
    onAlternarOv: vi.fn(),
    onAlternarOt: vi.fn(),
    cargarCentros: vi.fn().mockResolvedValue({ 1: "Cocina norte", 2: "Banquetes" }),
    ...extra,
  };
  render(<ImpresionBatchLista {...props} />);
  return props;
}

describe("ImpresionBatchLista", () => {
  it("marca la OV completa desde su casilla", async () => {
    const fila = ov("a");
    const props = montar([fila]);
    await userEvent.click(screen.getByLabelText("Seleccionar OV-a, Hotel Sol"));
    expect(props.onAlternarOv).toHaveBeenCalledWith(fila);
  });

  it("también marca la OV al pulsar sobre su fila", async () => {
    const fila = ov("a");
    const props = montar([fila]);
    await userEvent.click(screen.getByText("Hotel Sol"));
    expect(props.onAlternarOv).toHaveBeenCalledWith(fila);
  });

  it("agrupa por día de entrega con un encabezado y deja las sin fecha al final", () => {
    montar([
      ov("a", { fechaEntrega: "2026-11-06" }),
      ov("b", { fechaEntrega: "2026-11-06" }),
      ov("c", { fechaEntrega: "2026-11-07" }),
      ov("d", { fechaEntrega: null }),
    ]);
    const encabezados = screen
      .getAllByRole("listitem", { hidden: true })
      .filter((item) => item.getAttribute("aria-hidden") === "true")
      .map((item) => item.textContent);
    expect(encabezados).toEqual([
      "Viernes, 6 de noviembre",
      "Sábado, 7 de noviembre",
      "Sin fecha de entrega",
    ]);
  });

  it("una OV de una sola OT no se despliega", () => {
    montar([ov("a")]);
    expect(screen.getByText("1 OT")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /OT/ })).toBeNull();
  });

  it("al desplegar muestra el centro de consumo de cada OT y deja marcar una suelta", async () => {
    const fila = ov("b", { ordenesTrabajo: 3 });
    const props = montar([fila]);
    const boton = screen.getByRole("button", { name: /3 OT/ });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(screen.getByText("Cocina norte")).toBeInTheDocument());
    expect(screen.getByText("Banquetes")).toBeInTheDocument();
    expect(screen.getByText("Sin centro de consumo")).toBeInTheDocument();
    expect(props.cargarCentros).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByLabelText(/OT 2 de 3/));
    expect(props.onAlternarOt).toHaveBeenCalledWith(fila, 2);
  });

  it("no vuelve a pedir los centros al cerrar y abrir de nuevo", async () => {
    const props = montar([ov("b", { ordenesTrabajo: 2 })]);
    const boton = screen.getByRole("button", { name: /2 OT/ });
    await userEvent.click(boton);
    await userEvent.click(boton);
    await userEvent.click(boton);
    expect(props.cargarCentros).toHaveBeenCalledTimes(1);
  });

  it("si no se pueden leer los centros lo dice en cada OT", async () => {
    montar([ov("b", { ordenesTrabajo: 2 })], {
      cargarCentros: vi.fn().mockRejectedValue(new Error("red")),
    });
    await userEvent.click(screen.getByRole("button", { name: /2 OT/ }));
    await waitFor(() => expect(screen.getAllByText("No se pudo leer")).toHaveLength(2));
  });

  it("muestra cuántas OT hay elegidas y deja la casilla de la OV en parcial", () => {
    const fila = ov("b", { ordenesTrabajo: 3 });
    const seleccion: SeleccionBatch = new Map([["b", new Set([1])]]);
    montar([fila], { seleccion });
    expect(screen.getByRole("button", { name: /1 de 3 OT/ })).toBeInTheDocument();
    const casilla = screen.getByLabelText("Seleccionar OV-b, Hotel Sol") as HTMLInputElement;
    expect(casilla.indeterminate).toBe(true);
    expect(casilla.checked).toBe(false);
  });

  it("el control de OT siempre apunta a una lista que existe, aunque esté cerrada", () => {
    montar([ov("b", { ordenesTrabajo: 2 })]);
    const boton = screen.getByRole("button", { name: /2 OT/ });
    const id = boton.getAttribute("aria-controls")!;
    expect(document.getElementById(id)).not.toBeNull();
  });
});
