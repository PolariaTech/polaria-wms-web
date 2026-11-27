import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrdenVentaAdjuntoPreviewModal } from "./OrdenVentaAdjuntoPreviewModal";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("OrdenVentaAdjuntoPreviewModal", () => {
  it("muestra imagen cuando el adjunto es IMG", () => {
    render(
      <OrdenVentaAdjuntoPreviewModal
        open
        adjunto={{
          nombre: "foto.png",
          mime: "image/png",
          url: "https://example.com/foto.png",
        }}
        viewUrl="https://example.com/foto.png"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "foto.png" })).toHaveAttribute(
      "src",
      "https://example.com/foto.png",
    );
  });

  it("carga PDF/EML por fetch→blob para el iframe (evita X-Frame-Options)", async () => {
    const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/pdf" }),
        blob: async () => blob,
      }),
    );
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-pdf");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });

    render(
      <OrdenVentaAdjuntoPreviewModal
        open
        adjunto={{
          nombre: "pedido.pdf",
          mime: "application/pdf",
          path: "cuenta/uuid.pdf",
        }}
        viewUrl="/api/ov-adjuntos/file?path=cuenta%2Fuuid.pdf"
        dockWithCypher
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        document.querySelector('iframe[title="pedido.pdf"]'),
      ).toHaveAttribute(
        "src",
        "blob:mock-pdf#toolbar=0&navpanes=0&zoom=page-width",
      );
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/ov-adjuntos/file?path=cuenta%2Fuuid.pdf",
    );
  });

  it("con dock, aria-modal es false para no bloquear el ojo de otros adjuntos", () => {
    render(
      <OrdenVentaAdjuntoPreviewModal
        open
        adjunto={{
          nombre: "oc.pdf",
          mime: "application/pdf",
          path: "cuenta/oc.pdf",
        }}
        viewUrl="/api/ov-adjuntos/file?path=cuenta%2Foc.pdf"
        dockWithCypher
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "false");
  });

  it("REQ-330: con dock expone el rail de resize del Cypher", () => {
    render(
      <OrdenVentaAdjuntoPreviewModal
        open
        adjunto={{
          nombre: "oc.html",
          mime: "text/html",
          path: "cuenta/oc.html",
        }}
        viewUrl="/api/ov-adjuntos/file?path=cuenta%2Foc.html"
        dockWithCypher
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("separator", { name: "Redimensionar panel Cypher" }),
    ).toBeInTheDocument();
  });

  it("REQ-330: sin dock no muestra el rail de resize", () => {
    render(
      <OrdenVentaAdjuntoPreviewModal
        open
        adjunto={{
          nombre: "foto.png",
          mime: "image/png",
          url: "https://example.com/foto.png",
        }}
        viewUrl="https://example.com/foto.png"
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("separator", { name: "Redimensionar panel Cypher" }),
    ).not.toBeInTheDocument();
  });

  it("nombre largo no empuja Cerrar: el título trunca con title completo", () => {
    const nombreLargo =
      "PO_300_20973_CUNQR413_1794247743320_arCUNWA0035557_from_email.pdf";
    render(
      <OrdenVentaAdjuntoPreviewModal
        open
        adjunto={{
          nombre: nombreLargo,
          mime: "application/pdf",
          path: "cuenta/oc.pdf",
        }}
        viewUrl="/api/ov-adjuntos/file?path=cuenta%2Foc.pdf"
        dockWithCypher
        onClose={vi.fn()}
      />,
    );

    const heading = screen.getByRole("heading", { name: nombreLargo });
    expect(heading).toHaveClass("truncate");
    expect(heading).toHaveAttribute("title", nombreLargo);
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveClass(
      "shrink-0",
    );
  });

  it("muestra controles de zoom +/− junto a Cerrar", () => {
    render(
      <OrdenVentaAdjuntoPreviewModal
        open
        adjunto={{
          nombre: "oc.pdf",
          mime: "application/pdf",
          path: "cuenta/oc.pdf",
        }}
        viewUrl="/api/ov-adjuntos/file?path=cuenta%2Foc.pdf"
        dockWithCypher
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Acercar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alejar" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Restablecer zoom" }),
    ).toHaveTextContent("Ancho");
  });

  it("REQ-327: iframe HTML llena el panel; Polaria en 100%", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        text: async () => "<html><head></head><body><p>OC</p></body></html>",
      }),
    );

    render(
      <OrdenVentaAdjuntoPreviewModal
        open
        adjunto={{
          nombre: "oc-altura.html",
          mime: "text/html",
          path: "cuenta/oc-altura.html",
        }}
        viewUrl="/api/ov-adjuntos/file?path=cuenta%2Foc-altura.html"
        dockWithCypher
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      const iframe = document.querySelector(
        'iframe[title="oc-altura.html"]',
      ) as HTMLIFrameElement | null;
      expect(iframe).toBeTruthy();
      expect(iframe?.className).not.toMatch(/72vh/);
      expect(iframe?.style.height).toBe("100%");
      expect(iframe?.style.transform).toContain("scale(1)");
      expect(iframe?.getAttribute("srcdoc")).toContain("background:#fff");
      expect(iframe?.getAttribute("srcdoc")).not.toContain("zoom:");
    });
  });

});
