import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PolariaTableBodySkeleton } from "./PolariaTableBodySkeleton";

describe("PolariaTableBodySkeleton", () => {
  it("pinta el número de filas y celdas pedido", () => {
    const { container } = render(
      <table>
        <tbody>
          <PolariaTableBodySkeleton columnCount={4} rowCount={3} />
        </tbody>
      </table>,
    );
    expect(container.querySelectorAll("tr")).toHaveLength(3);
    expect(container.querySelectorAll("td")).toHaveLength(12);
    expect(screen.getAllByRole("row", { hidden: true }).length).toBeGreaterThan(0);
  });
});
