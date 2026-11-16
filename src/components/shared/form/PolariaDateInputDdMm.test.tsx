import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PolariaDateInputDdMm } from "./PolariaDateInputDdMm";

describe("PolariaDateInputDdMm (REQ-320/321)", () => {
  it("muestra ISO como DD-MMM-AAAA (DÍA)", () => {
    render(
      <PolariaDateInputDdMm
        id="fecha-test"
        label="Fecha"
        value="2026-11-12"
        onChange={() => undefined}
      />,
    );
    expect(screen.getByLabelText("Fecha")).toHaveValue("12-NOV-2026 (JUEVES)");
    expect(screen.getByPlaceholderText("DD-MMM-AAAA")).toBeInTheDocument();
  });

  it("al confirmar texto DD-MMM-AAAA emite ISO", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PolariaDateInputDdMm
        id="fecha-test"
        label="Fecha"
        value=""
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText("Fecha");
    await user.clear(input);
    await user.type(input, "12-NOV-2026{Enter}");
    expect(onChange).toHaveBeenCalledWith("2026-11-12");
  });

  it("bloquea caracteres inválidos al escribir", async () => {
    const user = userEvent.setup();
    render(
      <PolariaDateInputDdMm
        id="fecha-test"
        label="Fecha"
        value=""
        onChange={() => undefined}
      />,
    );
    const input = screen.getByLabelText("Fecha");
    await user.type(input, "12@NOV#2026");
    expect(input).toHaveValue("12NOV2026");
  });
});
