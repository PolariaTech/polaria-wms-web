import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/shared/module/OperationalModuleShell", () => ({
  OperationalModuleShell: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/modules/sales/correos/components/CorreosTable", () => ({
  CorreosTable: ({ modo }: { modo: string }) => (
    <div>Tabla correos {modo}</div>
  ),
}));

import DashboardVentasCorreosMateoPage from "./page";

describe("página Correos procesados (Mateo)", () => {
  it("muestra el shell y la tabla en modo procesados", async () => {
    render(<DashboardVentasCorreosMateoPage />);
    expect(
      await screen.findByRole("heading", { name: "Correos procesados" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Tabla correos procesados"),
    ).toBeInTheDocument();
  });
});
