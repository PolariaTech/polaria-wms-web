import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrdenTrabajoChipSelector } from "./OrdenTrabajoChipSelector";

describe("OrdenTrabajoChipSelector", () => {
  it("renderiza chips 1…N y selecciona por id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <OrdenTrabajoChipSelector
        items={[
          { id: "a", label: "OC — Almacén A" },
          { id: "b", label: "OC — Almacén B" },
          { id: "c", label: "OC — Almacén C" },
        ]}
        selectedId="b"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole("option", { name: /Orden de trabajo 1/i })).toHaveTextContent(
      "1",
    );
    expect(screen.getByRole("option", { name: /Orden de trabajo 2/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: /Orden de trabajo 3/i })).toHaveTextContent(
      "3",
    );

    await user.click(screen.getByRole("option", { name: /Orden de trabajo 1/i }));
    expect(onSelect).toHaveBeenCalledWith("a");
  });

  it("no renderiza nada sin ítems", () => {
    const { container } = render(
      <OrdenTrabajoChipSelector items={[]} onSelect={() => undefined} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
