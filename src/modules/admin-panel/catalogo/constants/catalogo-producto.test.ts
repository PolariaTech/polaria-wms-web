import { describe, expect, it } from "vitest";
import {
  isCatalogoTipoProductoMercancia,
  parseTipoProductoCodigo,
  resolveTipoProductoLabel,
} from "./catalogo-producto";

describe("tipo_producto (metadatos_catalogo)", () => {
  it("parsea códigos numéricos y string", () => {
    expect(parseTipoProductoCodigo(1)).toBe(1);
    expect(parseTipoProductoCodigo("3")).toBe(3);
    expect(parseTipoProductoCodigo(undefined)).toBeNull();
    expect(parseTipoProductoCodigo("")).toBeNull();
  });

  it("resuelve etiquetas Producto / Servicio", () => {
    expect(resolveTipoProductoLabel(1)).toBe("Producto");
    expect(resolveTipoProductoLabel("3")).toBe("Servicio");
    expect(resolveTipoProductoLabel(null)).toBe("—");
  });

  it("identifica solo mercancía vendible", () => {
    expect(isCatalogoTipoProductoMercancia(1)).toBe(true);
    expect(isCatalogoTipoProductoMercancia("1")).toBe(true);
    expect(isCatalogoTipoProductoMercancia(3)).toBe(false);
    expect(isCatalogoTipoProductoMercancia(null)).toBe(false);
  });
});
