import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntregaMapaModal } from "./EntregaMapaModal";

vi.mock("./use-entrega-mapa", () => ({
  useEntregaMapa: () => ({
    mapHostRef: { current: null },
    query: "Av. 10",
    setQuery: vi.fn(),
    hits: [],
    coords: { lat: 20.63, lng: -87.07 },
    direccionResuelta: "Av. 10, Playa",
    buscando: false,
    mapaListo: true,
    error: null,
    setError: vi.fn(),
    buscar: vi.fn(),
    elegirHit: vi.fn(),
  }),
}));

describe("EntregaMapaModal (REQ-251)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("abre en modo editar con título y confirma ubicación", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <EntregaMapaModal
        open
        onClose={onClose}
        direccionInicial="Av. 10"
        modo="editar"
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Ubicar entrega")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Usar esta ubicación/i }));
    expect(onConfirm).toHaveBeenCalledWith({
      direccion: "Av. 10, Playa",
      lat: 20.63,
      lng: -87.07,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("en modo ver muestra ubicación guardada", () => {
    render(
      <EntregaMapaModal
        open
        onClose={vi.fn()}
        direccionInicial="Av. 10"
        latInicial={20.63}
        lngInicial={-87.07}
        modo="ver"
      />,
    );
    expect(screen.getByText("Ubicación de entrega")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Usar esta ubicación/i })).toBeNull();
  });
});
