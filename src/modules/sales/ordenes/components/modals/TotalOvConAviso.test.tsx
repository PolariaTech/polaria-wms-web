import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TotalOvConAviso, textoTooltipTotalOv } from "./TotalOvConAviso";

describe("TotalOvConAviso (REQ-371)", () => {
  it("sin aviso muestra el valor sin resaltar ni tooltip", () => {
    const { container } = render(
      <TotalOvConAviso aviso={null}>$100.00</TotalOvConAviso>,
    );
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(container.querySelector("[data-total-ov-aviso]")).toBeNull();
    expect(container.querySelector("[title]")).toBeNull();
  });

  it("sin la prop aviso tampoco resalta", () => {
    const { container } = render(<TotalOvConAviso>$100.00</TotalOvConAviso>);
    expect(container.querySelector("[data-total-ov-aviso]")).toBeNull();
  });

  it("con aviso resalta en amarillo (paleta warning) y muestra el tooltip", () => {
    const aviso = { db: "Solicitud $120.00" };
    const { container } = render(
      <TotalOvConAviso aviso={aviso}>$100.00</TotalOvConAviso>,
    );
    const resaltado = container.querySelector("[data-total-ov-aviso]");
    expect(resaltado).not.toBeNull();
    expect(resaltado).toHaveTextContent("$100.00");
    expect(resaltado).toHaveClass("text-polaria-warning", "bg-polaria-warning-bg");
    expect(resaltado).toHaveAttribute("title", textoTooltipTotalOv(aviso));
  });

  it("el tooltip pide verificar el valor e incluye el total de la OC", () => {
    expect(textoTooltipTotalOv({ db: "Solicitud $120.00" })).toBe(
      "Verifica el valor: el total de la OV es diferente al de la OC (Solicitud $120.00).",
    );
  });
});
