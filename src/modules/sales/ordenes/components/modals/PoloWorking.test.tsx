import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PoloWorking } from "./PoloWorking";

describe("PoloWorking", () => {
  it("pinta la escena de planta de la marca como imagen decorativa y a un tamaño que la marca permite", () => {
    const { container } = render(<PoloWorking />);
    const img = container.querySelector("img")!;

    expect(img.getAttribute("alt")).toBe("");
    expect(Number(img.getAttribute("width"))).toBeGreaterThanOrEqual(64);
    const svg = decodeURIComponent(img.getAttribute("src")!.replace("data:image/svg+xml;charset=utf-8,", ""));
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('id="planta"');
    // Va sin la baldosa de fondo: la carga trae su propia tarjeta oscura.
    expect(svg).not.toContain('id="baldosa"');
    expect(svg).toContain("prefers-reduced-motion");
    // Tema claro: la misma escena CON su baldosa oscura, para que lo blanco se lea.
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]!.className).toContain('[html[data-theme="light"]_&]:hidden');
    expect(imgs[1]!.className).toContain('hidden [html[data-theme="light"]_&]:block');
    const conBaldosa = decodeURIComponent(
      imgs[1]!.getAttribute("src")!.replace("data:image/svg+xml;charset=utf-8,", ""),
    );
    expect(conBaldosa).toContain('id="baldosa"');
    // Solo colores de la marca (tokens.css).
    const colores = new Set(svg.match(/#[0-9a-fA-F]{6}/g)!.map((c) => c.toLowerCase()));
    expect([...colores].sort()).toEqual(["#00a591", "#00e5cc", "#020609", "#f8f8f6"]);
  });
});
