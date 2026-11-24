import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => // eslint-disable-next-line @next/next/no-img-element
    (<img alt={alt} />),
}));

vi.mock("./CapturaOrdenCard", () => ({
  CapturaOrdenCard: () => null,
}));

describe("CapturaOrdenView", () => {
  it("exporta la vista pública", async () => {
    const mod = await import("./CapturaOrdenView");
    expect(typeof mod.CapturaOrdenView).toBe("function");
  });
});
