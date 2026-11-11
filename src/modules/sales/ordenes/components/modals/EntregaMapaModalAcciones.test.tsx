import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntregaMapaModalAcciones } from "./EntregaMapaModalAcciones";

describe("EntregaMapaModalAcciones (REQ-251)", () => {
  it("muestra Waze, Maps y confirma en modo editar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <EntregaMapaModalAcciones
        modo="editar"
        coords={{ lat: 20.63, lng: -87.07 }}
        direccionResuelta="Playa del Carmen"
        query="Playa"
        error={null}
        copiado={false}
        onCopiar={vi.fn()}
        onCompartir={vi.fn()}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole("link", { name: /Waze/i })).toHaveAttribute(
      "href",
      expect.stringContaining("waze.com"),
    );
    expect(screen.getByRole("link", { name: /Google Maps/i })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Usar esta ubicación/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("en modo ver no muestra confirmar", () => {
    render(
      <EntregaMapaModalAcciones
        modo="ver"
        coords={{ lat: 20.63, lng: -87.07 }}
        direccionResuelta="Calle 1"
        query=""
        error={null}
        copiado={false}
        onCopiar={vi.fn()}
        onCompartir={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /Usar esta ubicación/i })).toBeNull();
    expect(screen.getByRole("button", { name: /Cerrar/i })).toBeTruthy();
  });
});
