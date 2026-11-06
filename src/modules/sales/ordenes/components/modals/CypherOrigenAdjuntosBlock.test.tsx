import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CypherOrigenAdjuntosBlock } from "./CypherOrigenAdjuntosBlock";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CypherOrigenAdjuntosBlock", () => {
  it("abre el preview dockeado al hacer clic en el ojo (REQ-266)", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["%PDF"], { type: "application/pdf" }),
      }),
    );
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue("blob:oc"),
      revokeObjectURL: vi.fn(),
    });

    render(
      <CypherOrigenAdjuntosBlock
        adjuntos={[
          {
            nombre: "orden-compra.pdf",
            path: "cuenta/uuid-oc.pdf",
            mime: "application/pdf",
          },
        ]}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Ver orden-compra.pdf"));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "orden-compra.pdf" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(dialog.querySelector("iframe")?.getAttribute("src")).toBe(
        "blob:oc",
      );
    });
  });

  it("permite cambiar de adjunto con el preview abierto", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["x"], { type: "text/html" }),
      }),
    );
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi
        .fn()
        .mockReturnValueOnce("blob:a")
        .mockReturnValueOnce("blob:b"),
      revokeObjectURL: vi.fn(),
    });

    render(
      <CypherOrigenAdjuntosBlock
        adjuntos={[
          {
            nombre: "a.pdf",
            path: "cuenta/a.pdf",
            mime: "application/pdf",
          },
          {
            nombre: "b.eml",
            path: "cuenta/b.eml",
            mime: "message/rfc822",
          },
        ]}
      />,
    );

    await user.click(screen.getByLabelText("Ver a.pdf"));
    expect(screen.getByRole("heading", { name: "a.pdf" })).toBeInTheDocument();

    await user.click(screen.getByLabelText("Ver b.eml"));
    expect(screen.getByRole("heading", { name: "b.eml" })).toBeInTheDocument();
  });
});
