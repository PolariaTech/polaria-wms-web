import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrefacturaDocumento } from "./prefactura-documento";

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn(async () => "data:image/png;base64,QR") },
}));

vi.mock("@/modules/sales/ordenes/print/resolve-captura-orden-origin", () => ({
  resolveCapturaOrdenOrigin: vi.fn(() => "http://localhost:3001"),
}));

import QRCode from "qrcode";
import { resolveCapturaOrdenOrigin } from "@/modules/sales/ordenes/print/resolve-captura-orden-origin";
import { adjuntarQrRecepcion } from "./recepcion-prefactura-qr";

const documento = {
  codigoEmpresa: "Y9IHZ",
  folio: "OV-1",
  ordenTrabajoId: "unica",
} as PrefacturaDocumento;

describe("adjuntarQrRecepcion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deja la hoja sin QR si no hay origen de la app", async () => {
    vi.mocked(resolveCapturaOrdenOrigin).mockReturnValueOnce("");
    const [resultado] = await adjuntarQrRecepcion([documento]);
    expect(resultado?.qrDataUrl).toBeUndefined();
    expect(QRCode.toDataURL).not.toHaveBeenCalled();
  });

  it("pega el enlace de empresa, OV y OT", async () => {
    const [resultado] = await adjuntarQrRecepcion([documento]);
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      "http://localhost:3001/recepcion-prefactura?empresa=Y9IHZ&ov=OV-1&ot=unica",
      expect.objectContaining({ errorCorrectionLevel: "M", margin: 1 }),
    );
    expect(resultado?.qrDataUrl).toBe("data:image/png;base64,QR");
  });
});
