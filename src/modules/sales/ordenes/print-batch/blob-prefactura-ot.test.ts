import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";
import { blobPrefacturaDeOt } from "./blob-prefactura-ot";

vi.mock("./cargar-empresa-prefactura", () => ({
  cargarEmpresaPrefactura: vi.fn(async () => ({})),
}));

vi.mock("./cargar-comprador-prefactura", () => ({
  cargarCompradorPrefactura: vi.fn(async () => ({})),
}));

vi.mock("./recepcion-prefactura-qr", () => ({
  adjuntarQrRecepcion: vi.fn(async (documentos: unknown) => documentos),
}));

vi.mock("./prefactura-documento", () => ({
  documentosPrefactura: vi.fn(() => [
    { ordenTrabajoId: "ot-1" },
    { ordenTrabajoId: "ot-2" },
  ]),
}));

const render = vi.fn((documentos: { ordenTrabajoId: string }[]) => ({
  output: () => new Uint8Array([documentos.length]).buffer,
}));

vi.mock("./render-prefactura-pdf", () => ({
  renderPrefacturasPdf: (documentos: { ordenTrabajoId: string }[]) => render(documentos),
}));

describe("blobPrefacturaDeOt", () => {
  it("arma el PDF solo de la orden de trabajo pedida", async () => {
    const blob = await blobPrefacturaDeOt({ id_comprador: "c1" } as OrdenVentaDetalleRow, "Y9IHZ", "ot-2");
    expect(blob.type).toBe("application/pdf");
    expect(render).toHaveBeenCalledWith([{ ordenTrabajoId: "ot-2" }]);
  });
});
