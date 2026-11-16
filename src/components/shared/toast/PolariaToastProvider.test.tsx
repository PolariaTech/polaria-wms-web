import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  PolariaToastProvider,
  usePolariaToast,
} from "./PolariaToastProvider";

function ToastTrigger() {
  const { showToast } = usePolariaToast();
  return (
    <button
      type="button"
      onClick={() =>
        showToast({ content: "OV guardada", variant: "success" })
      }
    >
      Guardar
    </button>
  );
}

describe("PolariaToastProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra toast aunque crypto.randomUUID no exista", () => {
    vi.stubGlobal("crypto", {});

    render(
      <PolariaToastProvider>
        <ToastTrigger />
      </PolariaToastProvider>,
    );

    expect(() => {
      act(() => {
        screen.getByRole("button", { name: "Guardar" }).click();
      });
    }).not.toThrow();

    expect(screen.getByText("OV guardada")).toBeTruthy();
  });
});
