import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/sales/ordenes/print-batch/ImpresionBatchPageContent", () => ({
  ImpresionBatchPageContent: () => <div>Pantalla de impresión en batch</div>,
}));

import DashboardVentasImpresionBatchPage from "./page";

describe("página de Impresión en batch", () => {
  it("muestra la pantalla del módulo de ventas", () => {
    render(<DashboardVentasImpresionBatchPage />);
    expect(screen.getByText("Pantalla de impresión en batch")).toBeInTheDocument();
  });
});
