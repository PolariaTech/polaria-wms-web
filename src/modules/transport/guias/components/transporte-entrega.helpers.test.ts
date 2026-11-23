import { describe, expect, it, vi } from "vitest";
import {
  dataUrlToFile,
  firmaCanvasToDataUrl,
  lineaProductoLabel,
  MAX_EVIDENCIA_BYTES,
  parseCantidad,
  PASOS_ENTREGA,
} from "./transporte-entrega.helpers";

describe("transporte-entrega.helpers", () => {
  it("constantes", () => {
    expect(PASOS_ENTREGA).toBe(4);
    expect(MAX_EVIDENCIA_BYTES).toBe(10 * 1024 * 1024);
  });

  it("parseCantidad acepta coma y rechaza inválidos", () => {
    expect(parseCantidad("12,5")).toBe(12.5);
    expect(parseCantidad(" 3 ")).toBe(3);
    expect(parseCantidad("")).toBeNull();
    expect(parseCantidad("abc")).toBeNull();
    expect(parseCantidad("-1")).toBeNull();
  });

  it("lineaProductoLabel combina sku y descripción", () => {
    const make = (sku?: string, descripcion?: string) =>
      ({ producto: { sku, descripcion } }) as never;
    expect(lineaProductoLabel(make("S1", "Pollo"))).toBe("S1 Pollo");
    expect(lineaProductoLabel(make(undefined, "Pollo"))).toBe("Pollo");
    expect(lineaProductoLabel(make("S1"))).toBe("S1");
    expect(lineaProductoLabel({ producto: null } as never)).toBe("Producto");
  });

  it("firmaCanvasToDataUrl pide JPEG con calidad 0.82", () => {
    const toDataURL = vi.fn(() => "data:image/jpeg;base64,xx");
    const result = firmaCanvasToDataUrl({ toDataURL } as never);
    expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.82);
    expect(result).toBe("data:image/jpeg;base64,xx");
  });

  it("dataUrlToFile crea un File con el nombre dado", async () => {
    const blob = new Blob(["abc"], { type: "image/jpeg" });
    vi.stubGlobal("fetch", vi.fn(async () => ({ blob: async () => blob })));

    const file = await dataUrlToFile("data:image/jpeg;base64,YWJj", "firma.jpg");

    expect(file.name).toBe("firma.jpg");
    expect(file.type).toBe("image/jpeg");
    vi.unstubAllGlobals();
  });
});
