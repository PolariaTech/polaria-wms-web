import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CapturaEstadoIcono,
  IconoCamara,
  IconoReintentar,
} from "./CapturaEstadoIcono";

describe("iconos de los botones", () => {
  it("la cámara y el reintento son decorativos (el botón lleva su texto)", () => {
    const camara = render(<IconoCamara />);
    const reintento = render(<IconoReintentar />);

    expect(camara.container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(
      reintento.container.querySelector("svg")?.getAttribute("aria-hidden"),
    ).toBe("true");
  });
});

describe("CapturaEstadoIcono", () => {
  it("es decorativo: el significado lo da el texto que lo acompaña", () => {
    const { container } = render(<CapturaEstadoIcono estado="lista" />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });

  it("cada estado se distingue por forma y relleno, no solo por color", () => {
    const subiendo = render(<CapturaEstadoIcono estado="subiendo" />);
    const lista = render(<CapturaEstadoIcono estado="lista" />);
    const fallo = render(<CapturaEstadoIcono estado="fallo" />);

    // Subiendo lleva el arco que gira; los otros dos no.
    expect(subiendo.container.querySelectorAll("svg")).toHaveLength(2);
    expect(lista.container.querySelectorAll("svg")).toHaveLength(1);
    expect(fallo.container.querySelectorAll("svg")).toHaveLength(1);

    // Lista va con fondo lleno; fallo con borde de peligro.
    expect(lista.container.firstElementChild?.className).toContain("bg-polaria-teal");
    expect(fallo.container.firstElementChild?.className).toContain(
      "border-polaria-danger",
    );
  });

  it("«procesando» se ve como «subiendo»: las dos son «en curso»", () => {
    const subiendo = render(<CapturaEstadoIcono estado="subiendo" />);
    const procesando = render(<CapturaEstadoIcono estado="procesando" />);

    expect(procesando.container.innerHTML).toBe(subiendo.container.innerHTML);
  });

  it("el arco que gira respeta «reducir movimiento»", () => {
    const { container } = render(<CapturaEstadoIcono estado="subiendo" />);
    const arco = container.querySelector("svg.animate-spin");
    expect(arco?.getAttribute("class")).toContain("motion-reduce:animate-none");
  });

  it("el tamaño pequeño es para las filas de la lista", () => {
    const { container } = render(<CapturaEstadoIcono estado="fallo" tamano="sm" />);
    expect(container.firstElementChild?.className).toContain("h-8");
  });
});
