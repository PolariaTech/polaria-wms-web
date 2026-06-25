import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PolariaDataTable } from "./PolariaDataTable";

interface Row {
  id: string;
  code: string;
  name: string;
}

describe("PolariaDataTable", () => {
  const columns = [
    {
      id: "code",
      header: "Código",
      cell: (row: Row) => row.code,
    },
    {
      id: "name",
      header: "Nombre",
      cell: (row: Row) => row.name,
    },
  ] as const;

  it("muestra encabezado, total y filas", () => {
    render(
      <PolariaDataTable<Row>
        title="Cuentas"
        subtitle="Código, nombre y acciones."
        isLoading={false}
        error={null}
        rows={[{ id: "1", code: "MIT00", name: "Mitre" }]}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyMessage="Sin registros"
      />,
    );

    expect(screen.getByRole("heading", { name: "Cuentas" })).toBeInTheDocument();
    expect(screen.getByText("Código, nombre y acciones.")).toBeInTheDocument();
    expect(screen.getByText("Total: 1")).toBeInTheDocument();
    expect(screen.getByText("MIT00")).toBeInTheDocument();
    expect(screen.getByText("Mitre")).toBeInTheDocument();
  });

  it("muestra estado vacío", () => {
    render(
      <PolariaDataTable<Row>
        title="Cuentas"
        isLoading={false}
        error={null}
        rows={[]}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyMessage="No hay cuentas"
      />,
    );

    expect(screen.getByText("No hay cuentas")).toBeInTheDocument();
  });
});
