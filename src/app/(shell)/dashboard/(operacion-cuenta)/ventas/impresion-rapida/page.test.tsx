import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/sales/ordenes/print-batch/ImpresionRapidaPageContent", () => ({
  ImpresionRapidaPageContent: () => <div>Pantalla de impresión rápida</div>,
}));

import DashboardVentasImpresionRapidaPage from "./page";

describe("página de Impresión rápida", () => {
  it("muestra la pantalla del módulo de ventas", () => {
    render(<DashboardVentasImpresionRapidaPage />);
    expect(screen.getByText("Pantalla de impresión rápida")).toBeInTheDocument();
  });
});
