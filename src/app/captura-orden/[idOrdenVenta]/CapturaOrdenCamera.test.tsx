import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CapturaOrdenCamera } from "./CapturaOrdenCamera";

function streamFake(): MediaStream {
  return {
    getTracks: () => [],
    getVideoTracks: () => [],
    getAudioTracks: () => [],
    active: true,
    id: "s1",
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaStream;
}

describe("CapturaOrdenCamera", () => {
  it("muestra cancelar mientras la cámara prepara el video", () => {
    render(
      <CapturaOrdenCamera
        stream={streamFake()}
        onCapture={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
  });
});
