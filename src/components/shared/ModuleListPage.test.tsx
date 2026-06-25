import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModuleListPage } from "./ModuleListPage";

interface Row {
  id: string;
  name: string;
}

describe("ModuleListPage", () => {
  it("muestra loading", () => {
    render(
      <ModuleListPage<Row>
        isLoading
        error={null}
        rows={[]}
        emptyMessage="Vacío"
        getRowKey={(row) => row.id}
        columns={[{ id: "name", header: "Nombre", cell: (row) => row.name }]}
      />,
    );

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it("muestra error", () => {
    render(
      <ModuleListPage<Row>
        isLoading={false}
        error="Fallo de red"
        rows={[]}
        emptyMessage="Vacío"
        getRowKey={(row) => row.id}
        columns={[{ id: "name", header: "Nombre", cell: (row) => row.name }]}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Fallo de red");
  });

  it("muestra empty state", () => {
    render(
      <ModuleListPage<Row>
        isLoading={false}
        error={null}
        rows={[]}
        emptyMessage="Sin registros"
        getRowKey={(row) => row.id}
        columns={[{ id: "name", header: "Nombre", cell: (row) => row.name }]}
      />,
    );

    expect(screen.getByText("Sin registros")).toBeInTheDocument();
  });

  it("renderiza filas en tabla", () => {
    render(
      <ModuleListPage<Row>
        isLoading={false}
        error={null}
        rows={[{ id: "1", name: "Item A" }]}
        emptyMessage="Sin registros"
        getRowKey={(row) => row.id}
        columns={[{ id: "name", header: "Nombre", cell: (row) => row.name }]}
      />,
    );

    expect(screen.getByText("Item A")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument();
  });
});
