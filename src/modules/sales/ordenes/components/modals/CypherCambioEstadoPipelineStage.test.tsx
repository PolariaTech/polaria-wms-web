import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { CypherCambioEstadoPipelineStage } from "./CypherCambioEstadoPipelineStage";

describe("CypherCambioEstadoPipelineStage", () => {
  it("queda como el ítem 05, después de Prefactura", () => {
    render(
      <CypherCambioEstadoPipelineStage
        openStages={new Set()}
        toggleAccordionStage={vi.fn()}
        orden={{ id_orden_venta: "ov-1" } as OrdenVentaDetalleRow}
        estado="por_confirmar"
        hijasFromOrden={[]}
        puedeAlmacen={false}
        onFotos={vi.fn()}
        estadosSuperiores={[]}
        estadoCambiando={null}
        setCambioEstadoError={vi.fn()}
        setEstadoPendiente={vi.fn()}
      />,
    );

    expect(screen.getByText("05")).toBeInTheDocument();
    expect(screen.getByText("Cambiar estado")).toBeInTheDocument();
  });
});
