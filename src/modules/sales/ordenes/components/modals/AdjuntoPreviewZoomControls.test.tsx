import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdjuntoPreviewZoomControls } from "./AdjuntoPreviewZoomControls";

describe("AdjuntoPreviewZoomControls", () => {
  it("Acercar y Alejar llaman onZoomChange con el paso", async () => {
    const user = userEvent.setup();
    const onZoomChange = vi.fn();
    render(<AdjuntoPreviewZoomControls zoom={1} onZoomChange={onZoomChange} />);

    await user.click(screen.getByRole("button", { name: "Acercar" }));
    expect(onZoomChange).toHaveBeenCalledWith(1.25);

    await user.click(screen.getByRole("button", { name: "Alejar" }));
    expect(onZoomChange).toHaveBeenCalledWith(0.75);
  });

  it("Restablecer vuelve a 100%", async () => {
    const user = userEvent.setup();
    const onZoomChange = vi.fn();
    render(
      <AdjuntoPreviewZoomControls zoom={1.5} onZoomChange={onZoomChange} />,
    );

    expect(screen.getByRole("button", { name: "Restablecer zoom" })).toHaveTextContent(
      "150%",
    );
    await user.click(screen.getByRole("button", { name: "Restablecer zoom" }));
    expect(onZoomChange).toHaveBeenCalledWith(1);
  });
});
