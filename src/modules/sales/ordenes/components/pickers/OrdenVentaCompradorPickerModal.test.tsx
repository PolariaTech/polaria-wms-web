import { act, fireEvent, render, screen } from "@testing-library/react";
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

  it("REQ-326: busca también por denominacionComercialOverride", () => {
    const relleno = Array.from({ length: 4 }, (_, i) => comprador(i + 10));
    const compradores: CompradorListRow[] = [
      {
        idComprador: "c-1",
        codigo: "001",
        comprador: "RAZON SOCIAL SIN MARCA",
        apodo: "",
        denominacionComercialOverride: "Fairmont Mayakoba",
        telefono: null,
        rfc: "",
        grupo: "",
        estaActivo: true,
      },
      {
        idComprador: "c-2",
        codigo: "002",
        comprador: "Otro Cliente",
        apodo: "",
        denominacionComercialOverride: "",
        telefono: null,
        rfc: "",
        grupo: "",
        estaActivo: true,
      },
      ...relleno,
    ];

    render(
      <OrdenVentaCompradorPickerModal
        open
        onClose={vi.fn()}
        compradores={compradores}
        onSelect={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar cliente" }), {
      target: { value: "fairmont" },
    });

    expect(screen.getByText("RAZON SOCIAL SIN MARCA")).toBeInTheDocument();
    expect(screen.getByText("Fairmont Mayakoba")).toBeInTheDocument();
    expect(screen.queryByText("Otro Cliente")).not.toBeInTheDocument();
  });

  it("REQ-326: marca Sugerido a los priorityIds", () => {
    const compradores = Array.from({ length: 5 }, (_, i) => comprador(i + 1));
    render(
      <OrdenVentaCompradorPickerModal
        open
        onClose={vi.fn()}
        compradores={compradores}
        priorityIds={["c-2"]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Sugerido")).toBeInTheDocument();
  });
});
