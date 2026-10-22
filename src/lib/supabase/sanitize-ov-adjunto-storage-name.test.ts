import { describe, expect, it } from "vitest";
import { sanitizeOvAdjuntoStorageFileName } from "./sanitize-ov-adjunto-storage-name";

describe("sanitizeOvAdjuntoStorageFileName", () => {
  it("quita acentos y espacios (caso Café / Invalid key)", () => {
    expect(
      sanitizeOvAdjuntoStorageFileName(
        "Pedido_ADP-261021-1317-SVJ_Café azul.pdf",
      ),
    ).toBe("Pedido_ADP-261021-1317-SVJ_Cafe_azul.pdf");
  });

  it("elimina caracteres no seguros en la clave de Storage", () => {
    expect(sanitizeOvAdjuntoStorageFileName("a/b\\c?.pdf")).toBe("a_b_c.pdf");
  });

  it("conserva extensión en minúsculas", () => {
    expect(sanitizeOvAdjuntoStorageFileName("Pedido.PDF")).toBe("Pedido.pdf");
  });
});
