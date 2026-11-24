import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JefeBodegaTransferenciaOrigenToolbar } from "./jefe-bodega-transferencia-modal.toolbar";

describe("JefeBodegaTransferenciaOrigenToolbar", () => {
  it("notifica la zona elegida", async () => {
    const onChange = vi.fn();
    render(
      <JefeBodegaTransferenciaOrigenToolbar origenZona="almacenamiento" onChange={onChange} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Procesamiento" }));
    expect(onChange).toHaveBeenCalledWith("procesamiento");
  });
});
