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
  it("muestra «Todas» a la vista con el total, y cuántas hay sin imprimir y ya impresas", () => {
    montar();

    expect(screen.getByRole("button", { name: "Todas (12)" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sin imprimir (9)" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Ya impresas (3)" })).toHaveAttribute("aria-pressed", "false");
  });

  it("avisa qué opción eligió el operador", async () => {
    const onChange = montar();

    await userEvent.click(screen.getByRole("button", { name: "Ya impresas (3)" }));

    expect(onChange).toHaveBeenCalledWith("impresas");
  });

  it("avisa con texto cuántas órdenes no se pudieron revisar, y no dice nada si todas se revisaron", () => {
    const { rerender } = render(
      <ImpresionBatchFiltroImpresion valor="todas" conteos={CONTEOS} buscando={false} sinRevisar={1} onChange={vi.fn()} />,
    );
    expect(screen.getByText(/No se pudo revisar 1 orden: podrían estar impresas/)).toBeInTheDocument();

    rerender(<ImpresionBatchFiltroImpresion valor="todas" conteos={CONTEOS} buscando={false} sinRevisar={3} onChange={vi.fn()} />);
    expect(screen.getByText(/No se pudo revisar 3 órdenes/)).toBeInTheDocument();

    rerender(<ImpresionBatchFiltroImpresion valor="todas" conteos={CONTEOS} buscando={false} sinRevisar={0} onChange={vi.fn()} />);
    expect(screen.queryByText(/No se pudo revisar/)).not.toBeInTheDocument();
  });

  it("mientras no sabe qué se imprimió antes no inventa cantidades y lo dice", () => {
    montar({ conteos: { todas: 12, sinImprimir: null, impresas: null }, buscando: true });

    expect(screen.getByRole("button", { name: "Sin imprimir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ya impresas" })).toBeInTheDocument();
    expect(screen.getByText("Revisando qué se imprimió antes…")).toHaveAttribute("aria-live", "polite");
  });
});
