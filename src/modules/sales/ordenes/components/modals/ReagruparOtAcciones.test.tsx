import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ReagruparOtAcciones,
  type ReagruparOtAccionesProps,
} from "./ReagruparOtAcciones";

function props(parcial: Partial<ReagruparOtAccionesProps> = {}): ReagruparOtAccionesProps {
  return {
    enPropuesta: false,
    enDivision: false,
    puedeDividir: true,
    dividiendo: false,
    cargando: false,
    generarDeshabilitado: false,
    onClose: vi.fn(),
    onRechazar: vi.fn(),
    onConfirmar: vi.fn(),
    onGenerar: vi.fn(),
    ...parcial,
  };
}

describe("ReagruparOtAcciones", () => {
  it("sin propuesta ofrece Cancelar y Generar", async () => {
    const p = props();
    render(<ReagruparOtAcciones {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "Generar" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(p.onGenerar).toHaveBeenCalledTimes(1);
    expect(p.onClose).toHaveBeenCalledTimes(1);
  });

  it("Generar se deshabilita según generarDeshabilitado", () => {
    render(<ReagruparOtAcciones {...props({ generarDeshabilitado: true })} />);
    expect(screen.getByRole("button", { name: "Generar" })).toBeDisabled();
  });

  it("mientras carga oculta Cancelar y bloquea Generar", () => {
    render(<ReagruparOtAcciones {...props({ cargando: true })} />);
    expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Generar" })).toBeDisabled();
  });

  it("con propuesta ofrece Rechazar y Confirmar", async () => {
    const p = props({ enPropuesta: true });
    render(<ReagruparOtAcciones {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "Rechazar" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(p.onRechazar).toHaveBeenCalledTimes(1);
    expect(p.onConfirmar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Generar" })).toBeNull();
  });

  it("una división sin onDividir no se puede confirmar", () => {
    render(
      <ReagruparOtAcciones
        {...props({ enPropuesta: true, enDivision: true, puedeDividir: false })}
      />,
    );
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
  });

  it("dividiendo muestra «Dividiendo…» y bloquea ambos botones", () => {
    render(
      <ReagruparOtAcciones
        {...props({ enPropuesta: true, enDivision: true, dividiendo: true })}
      />,
    );
    expect(screen.getByRole("button", { name: "Dividiendo…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeDisabled();
  });
});
