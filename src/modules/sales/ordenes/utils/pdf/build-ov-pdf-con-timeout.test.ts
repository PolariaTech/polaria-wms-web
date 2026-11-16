import { describe, expect, it, vi } from "vitest";
import { buildOvPdfBlobConTimeout } from "./build-ov-pdf-con-timeout";

vi.mock("../../print/download-orden-tarea-almacen-pdf", () => ({
  buildOrdenTareaAlmacenLandscapePdfBlob: vi.fn(async () => ({
    blob: new Blob(["pdf"]),
    filename: "ov.pdf",
  })),
}));

describe("buildOvPdfBlobConTimeout", () => {
  it("rechaza sin hojas", async () => {
    await expect(buildOvPdfBlobConTimeout([])).rejects.toThrow(
      /No hay datos/,
    );
  });

  it("devuelve el blob del PDF", async () => {
    const blob = await buildOvPdfBlobConTimeout([
      { idOrdenTrabajo: "ot-1" } as never,
    ]);
    expect(blob).toBeInstanceOf(Blob);
  });
});
