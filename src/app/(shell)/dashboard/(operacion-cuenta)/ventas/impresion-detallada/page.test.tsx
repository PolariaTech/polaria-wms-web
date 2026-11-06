import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/sales/ordenes/print-batch/ImpresionBatchPageContent", () => ({
  ImpresionBatchPageContent: () => <div>Pantalla de impresión detallada</div>,
}));

import DashboardVentasImpresionDetalladaPage from "./page";

describe("página de Impresión detallada", () => {
  it("muestra la pantalla del módulo de ventas", () => {
    render(<DashboardVentasImpresionDetalladaPage />);
    expect(screen.getByText("Pantalla de impresión detallada")).toBeInTheDocument();
  });
});
