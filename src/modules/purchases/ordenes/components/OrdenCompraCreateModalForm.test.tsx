import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  OrdenCompraCreateModalForm,
  type OrdenCompraCreateModalFormProps,
} from "./OrdenCompraCreateModalForm";

function buildProps(
  overrides: Partial<OrdenCompraCreateModalFormProps> = {},
): OrdenCompraCreateModalFormProps {
  return {
    open: true,
    handleClose: vi.fn(),
    handleSubmit: vi.fn(),
    error: null,
    isSubmitting: false,
    fechaEntrega: "2026-01-01",
    setFechaEntrega: vi.fn(),
    observaciones: "",
    setObservaciones: vi.fn(),
    selectedProveedorLabel: "",
    isLoadingOptions: false,
    proveedores: [],
    disabled: false,
    setProveedorPickerOpen: vi.fn(),
    selectedProductoLabel: "",
    productos: [],
    setProductoPickerOpen: vi.fn(),
    pickPesoKg: "",
    setPickPesoKg: vi.fn(),
    addLine: vi.fn(),
    lines: [{ idProducto: "p-1", pesoKg: 2.5, titleSnapshot: "Pollo" }],
    removeLine: vi.fn(),
    anyPickerOpen: false,
    ...overrides,
  };
}

describe("OrdenCompraCreateModalForm", () => {
  it("renderiza título, líneas y permite quitarlas", async () => {
    const props = buildProps({ error: "algo falló" });
    render(<OrdenCompraCreateModalForm {...props} />);

    expect(
      screen.getByRole("heading", { name: "Nueva orden de compra" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pollo")).toBeInTheDocument();
    expect(screen.getByText("algo falló")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Quitar línea" }));
    expect(props.removeLine).toHaveBeenCalledWith(0);
  });
});
