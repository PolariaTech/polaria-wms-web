import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OvEditPresenceBadge } from "./OvEditPresenceBadge";

describe("OvEditPresenceBadge (REQ-180)", () => {
  it("no renderiza sin holder o con lock caducado", () => {
    const { container: empty } = render(<OvEditPresenceBadge />);
    expect(empty.firstChild).toBeNull();

    const { container: stale } = render(
      <OvEditPresenceBadge
        editLockedBy="u2"
        editLockedAt={new Date(Date.now() - 10 * 60 * 1000).toISOString()}
        editLockedNombre="Luis"
      />,
    );
    expect(stale.firstChild).toBeNull();
  });

  it("muestra iniciales y tooltip del editor", () => {
    render(
      <OvEditPresenceBadge
        editLockedBy="u2"
        editLockedAt={new Date().toISOString()}
        editLockedNombre="Luis Pérez"
        viewerId="u1"
      />,
    );
    expect(screen.getByLabelText("Luis Pérez está editando")).toHaveTextContent(
      "LP",
    );
  });
});
