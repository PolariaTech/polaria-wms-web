import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImpresionBatchRefrescar } from "./ImpresionBatchRefrescar";

describe("ImpresionBatchRefrescar", () => {
  it("tiene nombre accesible «Actualizar lista» y llama a onRefrescar al pulsarlo", async () => {
    const onRefrescar = vi.fn();
    render(<ImpresionBatchRefrescar onRefrescar={onRefrescar} disabled={false} refrescando={false} />);

    await userEvent.click(screen.getByRole("button", { name: "Actualizar lista" }));

    expect(onRefrescar).toHaveBeenCalledTimes(1);
  });

  it("no se puede pulsar mientras está deshabilitado", async () => {
    const onRefrescar = vi.fn();
    render(<ImpresionBatchRefrescar onRefrescar={onRefrescar} disabled refrescando={false} />);

    const boton = screen.getByRole("button", { name: "Actualizar lista" });
    expect(boton).toBeDisabled();
    await userEvent.click(boton);

    expect(onRefrescar).not.toHaveBeenCalled();
  });

  it("gira el ícono mientras hay una recarga en curso", () => {
    const { container, rerender } = render(
      <ImpresionBatchRefrescar onRefrescar={() => {}} disabled={false} refrescando={false} />,
    );
    expect(container.querySelector("svg")).not.toHaveClass("animate-spin");

    rerender(<ImpresionBatchRefrescar onRefrescar={() => {}} disabled={false} refrescando />);
    expect(container.querySelector("svg")).toHaveClass("animate-spin");
  });
});
