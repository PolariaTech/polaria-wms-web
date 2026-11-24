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

import DashboardVentasCorreosDescartadosPage from "./page";

describe("página Correos descartados", () => {
  it("muestra el shell y la tabla en modo descartados", async () => {
    render(<DashboardVentasCorreosDescartadosPage />);
    expect(
      await screen.findByRole("heading", { name: "Correos descartados" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Tabla correos descartados"),
    ).toBeInTheDocument();
  });
});
