import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImpresionBatchFiltroImpresion } from "./ImpresionBatchFiltroImpresion";

const CONTEOS = { todas: 12, sinImprimir: 9, impresas: 3 };

function montar(extra: Partial<Parameters<typeof ImpresionBatchFiltroImpresion>[0]> = {}) {
  const onChange = vi.fn();
  render(<ImpresionBatchFiltroImpresion valor="todas" conteos={CONTEOS} buscando={false} onChange={onChange} {...extra} />);
  return onChange;
}

describe("ImpresionBatchFiltroImpresion", () => {
  it("muestra «Todas las órdenes» a la vista con el total, y cuántas hay sin imprimir y ya impresas", () => {
    montar();

    expect(screen.getByRole("button", { name: "Todas las órdenes (12)" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sin imprimir (9)" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Ya impresas (3)" })).toHaveAttribute("aria-pressed", "false");
  });

  it("avisa qué opción eligió el operador", async () => {
    const onChange = montar();

    await userEvent.click(screen.getByRole("button", { name: "Ya impresas (3)" }));

    expect(onChange).toHaveBeenCalledWith("impresas");
  });

  it("mientras no sabe qué se imprimió antes no inventa cantidades y lo dice", () => {
    montar({ conteos: { todas: 12, sinImprimir: null, impresas: null }, buscando: true });

    expect(screen.getByRole("button", { name: "Sin imprimir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ya impresas" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Revisando qué se imprimió antes…");
  });
});
