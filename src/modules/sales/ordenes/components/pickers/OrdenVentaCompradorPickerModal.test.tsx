import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import { OrdenVentaCompradorPickerModal } from "./OrdenVentaCompradorPickerModal";

function comprador(i: number): CompradorListRow {
  return {
    idComprador: `c-${i}`,
    codigo: `COD-${i}`,
    comprador: `Cliente ${i}`,
    apodo: null,
    rfc: null,
    telefono: null,
  } as CompradorListRow;
}

describe("OrdenVentaCompradorPickerModal (REQ-228)", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("al abrir llama focus/select en el input de buscar", () => {
    vi.useFakeTimers();
    const focus = vi.spyOn(HTMLInputElement.prototype, "focus");
    const select = vi.spyOn(HTMLInputElement.prototype, "select");
    const compradores = Array.from({ length: 5 }, (_, i) => comprador(i + 1));

    render(
      <OrdenVentaCompradorPickerModal
        open
        onClose={vi.fn()}
        compradores={compradores}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("searchbox", { name: "Buscar cliente" }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(focus).toHaveBeenCalled();
    expect(select).toHaveBeenCalled();
  });
});
