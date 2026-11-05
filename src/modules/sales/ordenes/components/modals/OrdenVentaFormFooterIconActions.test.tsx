import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrdenVentaFormFooterIconActions } from "./OrdenVentaFormFooterIconActions";

describe("OrdenVentaFormFooterIconActions", () => {
  it("muestra solo iconos con tooltip de OT y guardar avance (REQ-232)", () => {
    render(
      <OrdenVentaFormFooterIconActions
        showEliminar
        indiceOt1Based={2}
        onEliminar={vi.fn()}
        onGuardarAvance={vi.fn()}
        guardarDisabled={false}
        isSaving={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Eliminar esta tarea · TAREA 2/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Guardar avance de toda esta venta/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Eliminar esta tarea/i)).not.toBeInTheDocument();
  });
});
