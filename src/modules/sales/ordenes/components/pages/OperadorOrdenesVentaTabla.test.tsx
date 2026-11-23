import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import {
  mensajeListadoVacio,
  OperadorOrdenesVentaTabla,
  type OperadorOrdenesVentaTablaProps,
} from "./OperadorOrdenesVentaTabla";
import { contarPorEstado } from "../../hooks/use-ordenes-venta-filas";

const fila = (id: string, estado: string, venta = id) =>
  ({ idOrdenVenta: id, estado, venta }) as unknown as OrdenVentaOperadorRow;

function props(parcial: Partial<OperadorOrdenesVentaTablaProps> = {}): OperadorOrdenesVentaTablaProps {
  return {
    estadoFiltro: null,
    onEstadoFiltroChange: vi.fn(),
    totalDelDia: 0,
    countsByEstado: contarPorEstado([]),
    isLoading: false,
    error: null,
    codigoCuenta: "C-1",
    rows: [],
    columns: [
      {
        id: "venta",
        header: "Venta",
        cell: (row: OrdenVentaOperadorRow) => row.venta,
      },
    ],
    fechaFiltroDia: null,
    inspect: false,
    isRefreshing: false,
    onRefresh: vi.fn(),
    onNuevaVenta: vi.fn(),
    onRowClick: vi.fn(),
    ...parcial,
  };
}

describe("mensajeListadoVacio", () => {
  it("prioriza el filtro de estado, luego el de día, luego el genérico", () => {
    expect(mensajeListadoVacio("confirmada", "2026-01-01")).toMatch(/^Sin órdenes en estado «/);
    expect(mensajeListadoVacio(null, "2026-01-01")).toBe("Sin órdenes con entrega hoy o mañana.");
    expect(mensajeListadoVacio(null, null)).toBe("Sin órdenes de venta registradas.");
  });
});

describe("OperadorOrdenesVentaTabla", () => {
  it("muestra el mensaje de vacío del listado", () => {
    render(<OperadorOrdenesVentaTabla {...props()} />);
    expect(screen.getByText("Sin órdenes de venta registradas.")).toBeInTheDocument();
  });

  it("sin cuenta activa muestra el error de cuenta", () => {
    render(<OperadorOrdenesVentaTabla {...props({ codigoCuenta: null })} />);
    expect(screen.getByText("No se encontró la cuenta activa.")).toBeInTheDocument();
  });

  it("el error del listado manda sobre el de cuenta", () => {
    render(<OperadorOrdenesVentaTabla {...props({ codigoCuenta: null, error: "Falló la carga" })} />);
    expect(screen.getByText("Falló la carga")).toBeInTheDocument();
  });

  it("«Nueva venta» llama onNuevaVenta y desaparece en inspección", async () => {
    const p = props();
    const { rerender } = render(<OperadorOrdenesVentaTabla {...p} />);
    await userEvent.click(screen.getByRole("button", { name: /Nueva venta/ }));
    expect(p.onNuevaVenta).toHaveBeenCalledTimes(1);

    rerender(<OperadorOrdenesVentaTabla {...p} inspect />);
    expect(screen.queryByRole("button", { name: /Nueva venta/ })).toBeNull();
  });

  it("clic en una fila llama onRowClick y etiqueta según el estado", async () => {
    const p = props({ rows: [fila("ov-1", "por_confirmar", "OV-1"), fila("ov-2", "confirmada", "OV-2")] });
    render(<OperadorOrdenesVentaTabla {...p} />);
    await userEvent.click(screen.getByLabelText("Revisar pedido OV-1 con Cypher"));
    expect(p.onRowClick).toHaveBeenCalledWith(p.rows[0]);
    expect(screen.getByLabelText("Ver detalle de venta OV-2")).toBeInTheDocument();
  });
});
