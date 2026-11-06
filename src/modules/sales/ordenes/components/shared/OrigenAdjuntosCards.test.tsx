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

  it("usa grid con altura uniforme entre tarjetas", () => {
    const { container } = render(
      <OrigenAdjuntosCards
        adjuntos={[
          {
            nombre: "a.pdf",
            path: "cuenta/a.pdf",
            bytes: 31_000,
          },
          {
            nombre: "b.eml",
            path: "cuenta/b.eml",
            bytes: 45_000,
          },
        ]}
      />,
    );

    const list = container.querySelector("ul");
    expect(list?.className).toContain("items-stretch");
    const cards = container.querySelectorAll("li");
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card.className).toContain("h-full");
    }
    expect(screen.getByText("30 KB")).toBeInTheDocument();
    expect(screen.getByText("44 KB")).toBeInTheDocument();
  });
});
