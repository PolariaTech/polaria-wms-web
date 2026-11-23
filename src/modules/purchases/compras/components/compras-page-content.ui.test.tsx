import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActionButton, TabButton, TableCellText } from "./compras-page-content.ui";

describe("compras-page-content.ui", () => {
  it("TableCellText usa el texto como title salvo el guion", () => {
    const { rerender } = render(<TableCellText text="Hola" />);
    expect(screen.getByText("Hola")).toHaveAttribute("title", "Hola");

    rerender(<TableCellText text="—" />);
    expect(screen.getByText("—")).not.toHaveAttribute("title");

    rerender(<TableCellText text="x" title="custom" />);
    expect(screen.getByText("x")).toHaveAttribute("title", "custom");
  });

  it("TabButton dispara onClick", async () => {
    const onClick = vi.fn();
    render(
      <TabButton active onClick={onClick}>
        Tab
      </TabButton>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Tab" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ActionButton respeta disabled y primary", async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <ActionButton label="Ir" onClick={onClick} primary />,
    );
    const button = screen.getByRole("button", { name: "Ir" });
    expect(button.className).toContain("bg-polaria-teal");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<ActionButton label="Ir" onClick={onClick} disabled />);
    expect(screen.getByRole("button", { name: "Ir" })).toBeDisabled();
  });
});
