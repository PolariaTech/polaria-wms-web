import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrdenVentaAdjuntoPreviewModal } from "./OrdenVentaAdjuntoPreviewModal";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("OrdenVentaAdjuntoPreviewModal zoom PDF", () => {
  it("el zoom de Polaria agranda el visor del PDF", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/pdf" }),
        blob: async () => new Blob(["%PDF-1.4"], { type: "application/pdf" }),
      }),
    );
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue("blob:mock-pdf"),
      revokeObjectURL: vi.fn(),
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

    const iframe = await waitFor(() => {
      const frame = document.querySelector(
        'iframe[title="pedido.pdf"]',
      ) as HTMLIFrameElement | null;
      expect(frame).toBeTruthy();
      return frame!;
    });
    expect(iframe.style.width).toBe("100%");

    await user.click(screen.getByRole("button", { name: "Acercar" }));

    expect(iframe.style.width).toBe("125%");
    expect(iframe.style.height).toBe("125%");
    expect(
      screen.getByRole("button", { name: "Restablecer zoom" }),
    ).toHaveTextContent("125%");
  });
});
