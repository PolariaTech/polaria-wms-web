import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  DetalleCypherToggleButton,
  DetalleEmitirButton,
} from "./OrdenVentaDetalleAcciones";

describe("DetalleCypherToggleButton", () => {
  it("con onToggleCypher abre Cypher y no cierra el detalle", async () => {
    const onToggleCypher = vi.fn();
    const onClose = vi.fn();
    render(<DetalleCypherToggleButton onToggleCypher={onToggleCypher} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir detalle Cypher" }));
    expect(onToggleCypher).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("sin onToggleCypher funciona como botón de cerrar", async () => {
    const onClose = vi.fn();
    render(<DetalleCypherToggleButton onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Cerrar detalle" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("DetalleEmitirButton", () => {
  it("emite al pulsar y dice «Emitir venta»", async () => {
    const onEmitir = vi.fn();
    render(<DetalleEmitirButton disabled={false} isEmitting={false} onEmitir={onEmitir} />);
    await userEvent.click(screen.getByRole("button", { name: "Emitir venta" }));
    expect(onEmitir).toHaveBeenCalledTimes(1);
  });

  it("emitiendo cambia el texto y respeta disabled", () => {
    render(<DetalleEmitirButton disabled isEmitting onEmitir={() => undefined} />);
    expect(screen.getByRole("button", { name: "Emitiendo…" })).toBeDisabled();
  });
});
