import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PolariaRemoteImage } from "./PolariaRemoteImage";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
  }: {
    alt: string;
    src: string;
  }) => // eslint-disable-next-line @next/next/no-img-element
    (<img alt={alt} src={src} />),
}));

describe("PolariaRemoteImage", () => {
  it("renderiza con alt y src", () => {
    render(
      <PolariaRemoteImage src="https://cdn.example/a.jpg" alt="Evidencia" />,
    );
    expect(screen.getByAltText("Evidencia")).toHaveAttribute(
      "src",
      "https://cdn.example/a.jpg",
    );
  });
});
