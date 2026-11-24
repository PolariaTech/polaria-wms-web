import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fila } from "../testing/correos.fixtures";
import { CorreosReintentarFila } from "./CorreosReintentarFila";

describe("CorreosReintentarFila", () => {
  it("muestra el error y dispara reintento", async () => {
    const onReintentar = vi.fn();
    const usuario = userEvent.setup();
    render(
      <ul>
        <CorreosReintentarFila
          fila={fila({
            asunto: "Pedido X",
            ingreso: {
              messageId: "m1",
              estado: "error",
              idOrdenVenta: null,
              codigoOrdenVenta: null,
              error: "sin renglones",
            },
          })}
          activo={false}
          ocupado={false}
          onReintentar={onReintentar}
        />
      </ul>,
    );

    expect(screen.getByText("sin renglones")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: /Reintentar/i }));
    expect(onReintentar).toHaveBeenCalled();
  });

  it("en activo muestra espera y deshabilita el botón", () => {
    render(
      <ul>
        <CorreosReintentarFila
          fila={fila({ asunto: "Pedido Y" })}
          activo
          ocupado
          onReintentar={vi.fn()}
        />
      </ul>,
    );

    expect(
      screen.getByText(/Esperando resultado del ingreso/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reintentar/i })).toBeDisabled();
  });
});
