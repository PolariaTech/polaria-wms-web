import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrdenVentaCypherDrawerChrome } from "./OrdenVentaCypherDrawerChrome";

describe("OrdenVentaCypherDrawerChrome", () => {
  it("pone el rail de resize dentro del panel (REQ-307)", () => {
    const stageNavRef = { current: null };
    render(
      <OrdenVentaCypherDrawerChrome
        titleId="cypher-title"
        codigo="OV-1"
        comprador="Hotel"
        occ="OCC-1"
        recibida="hoy"
        estado="por_confirmar"
        onClose={vi.fn()}
        stageNavRef={stageNavRef}
        activeStage="correo"
        scrollToStage={vi.fn()}
        isResizingWidth={false}
        handleResizePointerDown={vi.fn()}
        handleResizePointerMove={vi.fn()}
        handleResizePointerUp={vi.fn()}
      />,
    );

    const handle = screen.getByRole("separator", {
      name: "Redimensionar panel Cypher",
    });
    expect(handle.className).toContain("w-3");
    expect(handle.className).toContain("left-0");
    expect(handle.className).not.toContain("-translate-x-1/2");
  });
});
