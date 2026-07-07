import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("deshabilita acciones adicionales con tooltip", () => {
    render(
      <PolariaDataTable<Row>
        title="Catálogo"
        isLoading={false}
        error={null}
        rows={[]}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyMessage="Sin registros"
        additionalActions={[
          {
            label: "Importar Excel",
            disabled: true,
            title: "Disponible en iteración próxima",
            variant: "outline",
          },
        ]}
      />,
    );

    const button = screen.getByRole("button", { name: "Importar Excel" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute(
      "title",
      "Disponible en iteración próxima",
    );
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

  it("pagina filas con máximo 5 por página", async () => {
    const user = userEvent.setup();
    const rows = Array.from({ length: 6 }, (_, index) => ({
      id: String(index + 1),
      code: `C${index + 1}`,
      name: `Item ${index + 1}`,
    }));

    render(
      <PolariaDataTable<Row>
        title="Cuentas"
        isLoading={false}
        error={null}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyMessage="Sin registros"
      />,
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.queryByText("Item 6")).not.toBeInTheDocument();
    expect(screen.getByText("Mostrando 1–5 de 6")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Página siguiente" }));

    expect(screen.getByText("Item 6")).toBeInTheDocument();
    expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
  });
});
