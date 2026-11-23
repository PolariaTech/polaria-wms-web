import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { ConsolidadoPrefactura } from "./ConsolidadoPrefactura";

vi.mock("../../services/orden-venta-log.client", () => ({
  fetchOrdenVentaLog: vi.fn(async () => [
    { payloadTipo: "prefactura_aceptada", idOrdenTrabajo: "pedido:12251|almacen:bar norte" },
  ]),
  postOrdenVentaLog: vi.fn(async () => undefined),
}));

vi.mock("../../print-batch/blob-prefactura-ot", () => ({
  blobPrefacturaDeOt: vi.fn(async () => new Blob(["%PDF"], { type: "application/pdf" })),
}));

const orden = {
  id_orden_venta: "ov-1",
  codigo: "OV-1",
  codigo_cuenta: "cta-1",
  id_bodega: null,
  orden_compra_hotel: "",
  origen_correo: [
    { "Numero pedido": "12251", Almacen: "Bar Norte", Cantidad: 1 },
    { "Numero pedido": "12252", Almacen: "Cocina", Cantidad: 1 },
  ],
} as OrdenVentaDetalleRow;

describe("ConsolidadoPrefactura", () => {
  it("muestra el consolidado y abre el PDF al pulsar el ícono", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:una");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    render(<ConsolidadoPrefactura orden={orden} codigoEmpresa="Y9IHZ" />);

    expect(screen.queryByText("12251")).toBeNull();
    expect(screen.queryByText("12252")).toBeNull();
    expect((await screen.findAllByText("Bar Norte")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cocina").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sí").length).toBeGreaterThan(0);
    expect(screen.queryByTitle("Prefactura")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "PDF Bar Norte" }));
    expect(await screen.findByTitle("Prefactura")).toHaveAttribute("src", "blob:una");
  });
});
