import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CatalogoPrimarioPickerTable } from "./CatalogoPrimarioPickerTable";

const rows = [
  {
    idProducto: "p1",
    codigo: "C1",
    titulo: "Pollo",
    sku: "S1",
    categoria: "Aves",
    proveedor: "",
    label: "Pollo (S1)",
  },
];

describe("CatalogoPrimarioPickerTable", () => {
  it("selecciona una fila y notifica el cierre", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onAfterSelect = vi.fn();
    render(
      <CatalogoPrimarioPickerTable
        rows={rows}
        selectedId={null}
        onSelect={onSelect}
        onAfterSelect={onAfterSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seleccionar Pollo" }));
    expect(onSelect).toHaveBeenCalledWith(rows[0]);
    expect(onAfterSelect).toHaveBeenCalledTimes(1);
  });

  it("marca la fila seleccionada y usa guion para vacíos", () => {
    render(
      <CatalogoPrimarioPickerTable
        rows={rows}
        selectedId="p1"
        onSelect={() => undefined}
        onAfterSelect={() => undefined}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Seleccionar Pollo" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
