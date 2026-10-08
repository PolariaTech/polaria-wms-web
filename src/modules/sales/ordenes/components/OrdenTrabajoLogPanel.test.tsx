import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrdenTrabajoLogPanel } from "./OrdenTrabajoLogPanel";

const fetchOrdenVentaLog = vi.fn();

vi.mock("../services/orden-venta-log.client", () => ({
  fetchOrdenVentaLog: (...args: unknown[]) => fetchOrdenVentaLog(...args),
}));

describe("OrdenTrabajoLogPanel", () => {
  beforeEach(() => {
    fetchOrdenVentaLog.mockReset();
  });

  it("muestra solo el último evento visible y abre el historial al hacer click", async () => {
    const user = userEvent.setup();
    fetchOrdenVentaLog.mockResolvedValue([
      {
        id: "e1",
        mensaje: "Pedido enviado a bodega (emitido) por Operador Tecno.",
        createdAt: "2026-10-07T21:11:00.000Z",
        autor: "Operador Tecno",
        accion: "cambio_estado",
        idOrdenTrabajo: null,
      },
      {
        id: "e2",
        mensaje: "Orden de trabajo editada por Operador Tecno.",
        createdAt: "2026-10-07T21:10:30.000Z",
        autor: "Operador Tecno",
        accion: "actualizacion",
        idOrdenTrabajo: null,
      },
      {
        id: "e3",
        mensaje: "Esta orden de trabajo fue creada por Operador Tecno.",
        createdAt: "2026-10-07T21:10:00.000Z",
        autor: "Operador Tecno",
        accion: "creacion",
        idOrdenTrabajo: null,
      },
    ]);

    render(
      <OrdenTrabajoLogPanel
        idOrdenVenta="ov-1"
        codigoCuenta="49M04"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Orden de trabajo editada/),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/Pedido enviado a bodega/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Esta orden de trabajo fue creada/),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ver log completo/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).queryByText(/Pedido enviado a bodega/),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByText(/Orden de trabajo editada/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Esta orden de trabajo fue creada/),
    ).toBeInTheDocument();
  });
});
