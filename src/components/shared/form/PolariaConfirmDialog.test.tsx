import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PolariaConfirmDialog } from "./PolariaConfirmDialog";

vi.mock("@/stores/shell-overlay.store", () => ({
  useShellOverlayStore: (
    selector: (state: { cypherWidthMode: string }) => unknown,
  ) => selector({ cypherWidthMode: "normal" }),
}));

describe("PolariaConfirmDialog (REQ-304)", () => {
  it("monta el diálogo en document.body con capa nested", () => {
    const host = document.createElement("div");
    host.id = "ov-modal-host";
    document.body.appendChild(host);

    render(
      <PolariaConfirmDialog
        open
        stackLevel="nested"
        layout="dock-left"
        title="¿Confirmar el pedido?"
        onClose={() => {}}
        onConfirm={() => {}}
      />,
      { container: host },
    );

    const portal = document.body.querySelector(
      "[data-polaria-confirm-portal]",
    );
    expect(portal).toBeTruthy();
    expect(portal?.parentElement).toBe(document.body);
    expect(portal?.className).toContain("z-[120]");
    expect(host.contains(portal)).toBe(false);
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("¿Confirmar el pedido?")).toBeTruthy();

    host.remove();
  });

  it("REQ-335: en dock-left el portal deja pasar clics al Cypher", () => {
    render(
      <PolariaConfirmDialog
        open
        stackLevel="nested"
        layout="dock-left"
        title="¿Confirmar el pedido?"
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    const portal = document.body.querySelector(
      "[data-polaria-confirm-portal]",
    );
    expect(portal?.className).toContain("pointer-events-none");
    expect(portal?.className).not.toMatch(
      /(?:^|\s)pointer-events-auto(?:\s|$)/,
    );
    expect(screen.getByRole("alertdialog").className).toContain(
      "pointer-events-auto",
    );
    expect(screen.getByRole("button", { name: "Cerrar" }).className).toContain(
      "pointer-events-auto",
    );
  });
});
