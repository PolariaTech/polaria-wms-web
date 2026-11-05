import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImpresionBatchBarra } from "./ImpresionBatchBarra";

function barra(extra: Partial<Parameters<typeof ImpresionBatchBarra>[0]> = {}) {
  const props = {
    elegidasOv: 0,
    elegidasOt: 0,
    visibles: 12,
    puedeMarcarVisibles: true,
    hayElegidasVisibles: false,
    cargando: false,
    progreso: null,
    onMarcarVisibles: vi.fn(),
    onQuitarVisibles: vi.fn(),
    onLimpiar: vi.fn(),
    onAceptar: vi.fn(),
    ...extra,
  };
  render(<ImpresionBatchBarra {...props} />);
  return props;
}

describe("ImpresionBatchBarra", () => {
  it("sin selección dice que no hay nada y no deja continuar ni limpiar", () => {
    barra();
    expect(screen.getByText("Nada seleccionado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver vista previa" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Limpiar todo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Quitar las visibles" })).toBeDisabled();
  });

  it("cuenta las OT y las OV elegidas y deja continuar", async () => {
    const props = barra({ elegidasOv: 2, elegidasOt: 5 });
    expect(screen.getByRole("status")).toHaveTextContent("5 OT de 2 OV");
    await userEvent.click(screen.getByRole("button", { name: "Ver vista previa" }));
    expect(props.onAceptar).toHaveBeenCalledTimes(1);
  });

  it("agrupa las tres acciones sobre la selección y cada una responde", async () => {
    const props = barra({ elegidasOv: 1, elegidasOt: 1, visibles: 7, hayElegidasVisibles: true });
    const grupo = screen.getByRole("group", { name: "Acciones sobre la selección" });
    expect(grupo.querySelectorAll("button")).toHaveLength(3);
    await userEvent.click(screen.getByRole("button", { name: "Marcar las 7 visibles" }));
    await userEvent.click(screen.getByRole("button", { name: "Quitar las visibles" }));
    await userEvent.click(screen.getByRole("button", { name: "Limpiar todo" }));
    expect(props.onMarcarVisibles).toHaveBeenCalledTimes(1);
    expect(props.onQuitarVisibles).toHaveBeenCalledTimes(1);
    expect(props.onLimpiar).toHaveBeenCalledTimes(1);
  });

  it("sin resultados no promete «Marcar las 0 visibles»", () => {
    barra({ visibles: 0, puedeMarcarVisibles: false });
    expect(screen.getByRole("button", { name: "Marcar visibles" })).toBeDisabled();
  });

  it("no ofrece marcar visibles si ya están todas marcadas", () => {
    barra({ elegidasOv: 3, elegidasOt: 3, puedeMarcarVisibles: false, hayElegidasVisibles: true });
    expect(screen.getByRole("button", { name: /Marcar las/ })).toBeDisabled();
  });

  it("mientras carga muestra el avance, no se ve apagado y no dispara otra lectura", async () => {
    const props = barra({ elegidasOv: 5, elegidasOt: 9, cargando: true, progreso: "Leyendo OV 2 de 5…" });
    const principal = screen.getByRole("button", { name: "Leyendo OV 2 de 5…" });
    expect(principal).toHaveAttribute("aria-busy", "true");
    expect(principal).not.toBeDisabled();
    await userEvent.click(principal);
    expect(props.onAceptar).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Limpiar todo" })).toBeDisabled();
  });
});
