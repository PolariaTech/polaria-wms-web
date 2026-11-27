import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrdenVentaAdjuntoPreviewModal } from "./OrdenVentaAdjuntoPreviewModal";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("OrdenVentaAdjuntoPreviewModal dock", () => {
  it("REQ-293: con dock el panel va a la derecha (justify-end), no tapa la edición", () => {
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

    const dialog = screen.getByRole("dialog");
    const shell = dialog.parentElement;
    expect(shell?.className).toMatch(/justify-end/);
    expect(shell?.className).not.toMatch(/justify-start/);
  });

  it("monta el dialog en document.body (fuera del stacking de Cypher)", () => {
    const host = document.createElement("div");
    host.id = "cypher-host";
    document.body.appendChild(host);

    render(
      <OrdenVentaAdjuntoPreviewModal
        open
        adjunto={{
          nombre: "foto.png",
          mime: "image/png",
          url: "https://example.com/f.png",
        }}
        viewUrl="https://example.com/f.png"
        dockWithCypher
        onClose={vi.fn()}
      />,
      { container: host },
    );

    const dialog = screen.getByRole("dialog");
    expect(host.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);

    host.remove();
  });

  it("avisa si no hay URL de vista", () => {
    render(
      <OrdenVentaAdjuntoPreviewModal
        open
        adjunto={{ nombre: "x.pdf" }}
        viewUrl={null}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("No hay archivo para mostrar.")).toBeInTheDocument();
  });

  it("REQ-311: HTML de OC usa srcdoc (no blob) para CSS relativo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        text: async () =>
          "<html><head></head><body><table><tr><td>Total</td></tr></table></body></html>",
      }),
    );

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

    await waitFor(() => {
      const iframe = document.querySelector('iframe[title="oc.html"]');
      expect(iframe).toHaveAttribute("srcdoc");
      expect(iframe?.getAttribute("srcdoc")).toContain("background:#fff");
    });
  });
});
