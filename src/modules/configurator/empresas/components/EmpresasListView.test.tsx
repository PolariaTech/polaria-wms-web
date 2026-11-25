import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmpresasListView } from "./EmpresasListView";

vi.mock("../services/empresas.service", () => ({
  listEmpresasConfigurator: vi.fn().mockResolvedValue([]),
}));

describe("EmpresasListView", () => {
  it("muestra la columna de la ficha fiscal", async () => {
    render(<EmpresasListView />);

    expect(await screen.findByText("Empresas")).toBeInTheDocument();
    expect(screen.getByText("Ficha")).toBeInTheDocument();
  });
});
