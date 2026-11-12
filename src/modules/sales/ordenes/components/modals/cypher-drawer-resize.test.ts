import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setCypherWidthMode = vi.fn();

vi.mock("@/stores/shell-overlay.store", () => ({
  hydrateCypherWidthModeFromStorage: vi.fn(),
  useShellOverlayStore: (selector: (state: {
    cypherWidthMode: "compact" | "normal" | "wide";
    setCypherWidthMode: typeof setCypherWidthMode;
  }) => unknown) =>
    selector({
      cypherWidthMode: "normal",
      setCypherWidthMode,
    }),
}));

import { useCypherDrawerResize } from "./cypher-drawer-resize";

function pointerEvent(clientX: number) {
  return {
    button: 0,
    clientX,
    pointerId: 1,
    preventDefault: vi.fn(),
    currentTarget: {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    },
  } as unknown as React.PointerEvent<HTMLDivElement>;
}

describe("useCypherDrawerResize", () => {
  beforeEach(() => {
    setCypherWidthMode.mockClear();
  });

  it("al arrastrar a la izquierda ensancha el Cypher", () => {
    const { result } = renderHook(() => useCypherDrawerResize());
    act(() => {
      result.current.handleResizePointerDown(pointerEvent(400));
    });
    act(() => {
      result.current.handleResizePointerMove(pointerEvent(400 - 56));
    });
    expect(setCypherWidthMode).toHaveBeenCalledWith("wide");
  });

  it("al arrastrar a la derecha achica el Cypher", () => {
    const { result } = renderHook(() => useCypherDrawerResize());
    act(() => {
      result.current.handleResizePointerDown(pointerEvent(400));
    });
    act(() => {
      result.current.handleResizePointerMove(pointerEvent(400 + 56));
    });
    expect(setCypherWidthMode).toHaveBeenCalledWith("compact");
  });
});
