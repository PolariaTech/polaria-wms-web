import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrigenAdjuntosCards } from "./OrigenAdjuntosCards";

describe("OrigenAdjuntosCards", () => {
  it("muestra ojo para PDF, imagen y Office (REQ-266)", () => {
    render(
      <OrigenAdjuntosCards
        adjuntos={[
          {
            nombre: "pedido.pdf",
            path: "cuenta/uuid-pedido.pdf",
            mime: "application/pdf",
          },
          {
            nombre: "foto.png",
            url: "https://example.com/foto.png",
            mime: "image/png",
          },
          {
            nombre: "lista.xlsx",
            path: "cuenta/uuid-lista.xlsx",
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("Ver pedido.pdf")).toBeInTheDocument();
    expect(screen.getByLabelText("Ver foto.png")).toBeInTheDocument();
    expect(screen.getByLabelText("Ver lista.xlsx")).toBeInTheDocument();
  });

  it("con onPreviewAdjunto el ojo no abre pestaña y llama el callback", async () => {
    const onPreviewAdjunto = vi.fn();
    const user = userEvent.setup();

    render(
      <OrigenAdjuntosCards
        adjuntos={[
          {
            nombre: "oc.pdf",
            path: "cuenta/uuid-oc.pdf",
            mime: "application/pdf",
          },
        ]}
        onPreviewAdjunto={onPreviewAdjunto}
      />,
    );

    const ojo = screen.getByLabelText("Ver oc.pdf");
    expect(ojo.tagName).toBe("BUTTON");
    await user.click(ojo);

    expect(onPreviewAdjunto).toHaveBeenCalledTimes(1);
    expect(onPreviewAdjunto.mock.calls[0][0].nombre).toBe("oc.pdf");
    expect(onPreviewAdjunto.mock.calls[0][1]).toContain("/api/ov-adjuntos/file");
  });

  it("sin archivo no muestra ojo", () => {
    render(
      <OrigenAdjuntosCards adjuntos={[{ nombre: "solo-nombre.pdf" }]} />,
    );

    expect(screen.queryByLabelText(/Ver /)).not.toBeInTheDocument();
    expect(screen.getByText("Sin archivo")).toBeInTheDocument();
  });

  it("usa tarjetas compactas del mismo tamaño (REQ-102)", () => {
    const { container } = render(
      <OrigenAdjuntosCards
        adjuntos={[
          {
            nombre: "a.pdf",
            path: "cuenta/a.pdf",
            bytes: 31_000,
          },
          {
            nombre:
              "nombre-muy-largo-de-archivo-para-forzar-truncado-en-cypher.pdf",
            path: "cuenta/b.eml",
            bytes: 45_000,
          },
        ]}
      />,
    );

    const list = container.querySelector("ul");
    expect(list?.className).toContain("grid-cols-2");
    expect(list?.className).toContain("min-[360px]:grid-cols-3");
    const cards = container.querySelectorAll("[data-adjunto-card]");
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card.className).toContain("h-[5.25rem]");
    }
    const icons = container.querySelectorAll("svg");
    for (const icon of icons) {
      const className = icon.className.baseVal || icon.getAttribute("class") || "";
      expect(className).toContain("h-3");
      expect(className).toContain("w-3");
    }
    expect(screen.getByText("30 KB")).toBeInTheDocument();
    expect(screen.getByText("44 KB")).toBeInTheDocument();
    expect(
      screen.getByTitle(
        "nombre-muy-largo-de-archivo-para-forzar-truncado-en-cypher.pdf",
      ),
    ).toHaveClass("truncate");
  });

  it("con esDeEstaOv marca solo la tarjeta que devuelve true (REQ-313)", () => {
    render(
      <OrigenAdjuntosCards
        adjuntos={[
          { nombre: "OC-140188.pdf", path: "c/u-OC-140188.pdf", mime: "application/pdf" },
          { nombre: "OC-140182.pdf", path: "c/u-OC-140182.pdf", mime: "application/pdf" },
        ]}
        esDeEstaOv={(adjunto) => adjunto.nombre === "OC-140188.pdf"}
      />,
    );

    expect(screen.getAllByText("De esta OV")).toHaveLength(1);
    const tarjeta = screen.getByText("OC-140188.pdf").closest("li")!;
    expect(tarjeta).toHaveTextContent("De esta OV");
    expect(screen.getByText("OC-140182.pdf").closest("li")).not.toHaveTextContent("De esta OV");
  });

  it("sin esDeEstaOv no hay insignias (control)", () => {
    render(<OrigenAdjuntosCards adjuntos={[{ nombre: "a.pdf", path: "c/u-a.pdf" }]} />);

    expect(screen.queryByText("De esta OV")).not.toBeInTheDocument();
  });
});

