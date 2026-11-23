import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { CypherPrefacturaStage } from "./CypherPrefacturaStage";

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ session: { codigoEmpresa: "Y9IHZ" }, context: null }),
  },
}));

vi.mock("./ConsolidadoPrefactura", () => ({
  ConsolidadoPrefactura: () => <div>Consolidado de prefacturas</div>,
}));

const orden = { id_orden_venta: "ov-1", codigo: "OV-9", estado: "confirmada" } as OrdenVentaDetalleRow;

describe("CypherPrefacturaStage", () => {
  it("muestra el 04 y, al abrirlo, el consolidado de prefacturas", () => {
    render(
      <CypherPrefacturaStage
        openStages={new Set(["prefactura"])}
        toggleAccordionStage={vi.fn()}
        orden={orden}
      />,
    );

    expect(screen.getByText("04")).toBeInTheDocument();
    expect(screen.getByText("Prefactura")).toBeInTheDocument();
    expect(screen.getByText("Consolidado de prefacturas")).toBeInTheDocument();
  });

  it("una orden por confirmar no muestra la prefactura", () => {
    render(
      <CypherPrefacturaStage
        openStages={new Set(["prefactura"])}
        toggleAccordionStage={vi.fn()}
        orden={{ ...orden, estado: "por_confirmar" }}
      />,
    );

    expect(screen.getByText("La prefactura se muestra desde Confirmada.")).toBeInTheDocument();
    expect(screen.queryByText("Consolidado de prefacturas")).toBeNull();
  });
});
