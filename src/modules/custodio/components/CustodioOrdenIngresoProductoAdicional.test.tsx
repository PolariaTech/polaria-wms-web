import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustodioOrdenIngresoProductoAdicional } from "./CustodioOrdenIngresoProductoAdicional";

const CATALOGO = [
  { idProducto: "p-1", codigo: "C1", titulo: "Pollo" },
] as never;

const EMPTY = { idProducto: "", label: "", temperaturaInput: "", pesoInput: "" };

describe("CustodioOrdenIngresoProductoAdicional", () => {
  it("al elegir un producto arma el draft con label", async () => {
    const setProductoAdicional = vi.fn();
    render(
      <CustodioOrdenIngresoProductoAdicional
        productoAdicional={EMPTY}
        setProductoAdicional={setProductoAdicional}
        catalogo={CATALOGO}
        isSubmitting={false}
        isLoadingCatalogo={false}
      />,
    );

    await userEvent.selectOptions(screen.getByRole("combobox"), "p-1");

    expect(setProductoAdicional).toHaveBeenCalledWith({
      idProducto: "p-1",
      label: "C1 Pollo",
      temperaturaInput: "",
      pesoInput: "",
    });
  });

  it("muestra campos de temperatura y peso con producto elegido", () => {
    render(
      <CustodioOrdenIngresoProductoAdicional
        productoAdicional={{ ...EMPTY, idProducto: "p-1" }}
        setProductoAdicional={() => undefined}
        catalogo={CATALOGO}
        isSubmitting={false}
        isLoadingCatalogo={false}
      />,
    );

    expect(screen.getByPlaceholderText("Ej. 10,5")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ej: -18")).toBeInTheDocument();
  });

  it("indica carga del catálogo", () => {
    render(
      <CustodioOrdenIngresoProductoAdicional
        productoAdicional={EMPTY}
        setProductoAdicional={() => undefined}
        catalogo={[]}
        isSubmitting={false}
        isLoadingCatalogo
      />,
    );

    expect(screen.getByText("Cargando catálogo…")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
