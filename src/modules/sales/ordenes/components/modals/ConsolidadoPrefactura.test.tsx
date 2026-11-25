import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { fetchOrdenVentaLog } from "../../services/orden-venta-log.client";
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

function aprobadoDe(centro: string): string {
  const celda = screen
    .getAllByText(centro)
    .map((nodo) => nodo.closest("td"))
    .find((candidata) => candidata !== null);
  const celdas = celda?.closest("tr")?.querySelectorAll("td");
  return celdas?.[2]?.textContent ?? "";
}

const bitacoraInicial = async () => [
  { payloadTipo: "prefactura_aceptada", idOrdenTrabajo: "pedido:12251|almacen:bar norte" },
];

describe("ConsolidadoPrefactura", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(fetchOrdenVentaLog).mockReset();
    vi.mocked(fetchOrdenVentaLog).mockImplementation(bitacoraInicial);
  });

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

  it("pasa Aprobado a Sí cuando la bitácora trae el envío a Compaq", async () => {
    vi.useFakeTimers();
    vi.mocked(fetchOrdenVentaLog)
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        {
          payloadTipo: "prefactura_aceptada",
          idOrdenTrabajo: "pedido:12252|almacen:cocina",
        },
      ] as Awaited<ReturnType<typeof fetchOrdenVentaLog>>);

    render(<ConsolidadoPrefactura orden={orden} codigoEmpresa="Y9IHZ" />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(aprobadoDe("Cocina")).toBe("No");
    expect(aprobadoDe("Bar Norte")).toBe("No");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(aprobadoDe("Cocina")).toBe("Sí");
    expect(aprobadoDe("Bar Norte")).toBe("No");
  });

  it("al volver a la ventana pasa Aprobado a Sí sin esperar el siguiente ciclo", async () => {
    vi.useFakeTimers();
    vi.mocked(fetchOrdenVentaLog)
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        {
          payloadTipo: "prefactura_aceptada",
          idOrdenTrabajo: "pedido:12252|almacen:cocina",
        },
      ] as Awaited<ReturnType<typeof fetchOrdenVentaLog>>);

    render(<ConsolidadoPrefactura orden={orden} codigoEmpresa="Y9IHZ" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(aprobadoDe("Cocina")).toBe("No");

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(aprobadoDe("Cocina")).toBe("Sí");
    expect(aprobadoDe("Bar Norte")).toBe("No");
  });
});
