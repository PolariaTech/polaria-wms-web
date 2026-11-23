import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/sales/ordenes/print-batch/ImpresionBatchPageContent", () => ({
  ImpresionBatchPageContent: () => <div>Pantalla de impresión detallada</div>,
}));

import DashboardVentasImpresionDetalladaPage from "./page";

describe("página de Impresión detallada", () => {
  it("muestra la pantalla del módulo de ventas", async () => {
    render(<DashboardVentasImpresionDetalladaPage />);
    expect(
      await screen.findByText("Pantalla de impresión detallada"),
    ).toBeInTheDocument();
  });
});
