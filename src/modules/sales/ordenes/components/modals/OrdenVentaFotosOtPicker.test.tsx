import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrdenVentaFotosOtPicker } from "./OrdenVentaFotosOtPicker";

describe("OrdenVentaFotosOtPicker", () => {
  it("llama onSelectOt al elegir una OT", async () => {
    const user = userEvent.setup();
    const onSelectOt = vi.fn();
    render(
      <OrdenVentaFotosOtPicker
        isLoadingOts={false}
        onSelectOt={onSelectOt}
        ordenesTrabajo={[
          {
            idOrdenTrabajo: "ot-9",
            totalFotos: 2,
            ultimaAt: "2026-01-01T00:00:00Z",
            previewUrl: "https://example.com/a.jpg",
            numeroPedido: "555",
          },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Pedido 555/i }));
    expect(onSelectOt).toHaveBeenCalledWith("ot-9");
  });
});