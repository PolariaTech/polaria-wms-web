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
      expect(screen.getByTitle("pedido.pdf")).toHaveAttribute(
        "src",
        "blob:mock-pdf",
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
});
