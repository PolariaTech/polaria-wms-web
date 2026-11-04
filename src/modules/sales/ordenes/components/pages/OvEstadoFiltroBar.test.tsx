import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OvEstadoFiltroBar } from "./OvEstadoFiltroBar";
import { ESTADOS_ORDEN_VENTA } from "../../../shared/constants/sales-status";

describe("OvEstadoFiltroBar", () => {
  it("muestra Todos y un botón por estado", () => {
    const counts = Object.fromEntries(
      ESTADOS_ORDEN_VENTA.map((e) => [e, 0]),
    ) as Record<(typeof ESTADOS_ORDEN_VENTA)[number], number>;
    render(
      <OvEstadoFiltroBar
        estadoFiltro={null}
        onChange={vi.fn()}
        totalDelDia={3}
        countsByEstado={counts}
      />,
    );
    expect(screen.getByRole("button", { name: /Todos/ })).toBeInTheDocument();
  });
});
