import { describe, expect, it, beforeEach } from "vitest";
import {
  buildLeerPedidoCacheKey,
  clearLeerPedidoCache,
  getLeerPedidoCache,
  setLeerPedidoCache,
} from "./leer-pedido-cache";

describe("leer-pedido-cache", () => {
  beforeEach(() => {
    clearLeerPedidoCache();
  });

  it("guarda y recupera por clave", () => {
    const key = buildLeerPedidoCacheKey({
      codigoCuenta: "ACME",
      texto: "pedido",
      archivos: [{ nombre: "a.pdf", size: 10, base64Head: "AAAA" }],
    });
    setLeerPedidoCache(key, { ok: true });
    expect(getLeerPedidoCache(key)).toEqual({ ok: true });
  });

  it("miss si no hay entrada", () => {
    expect(getLeerPedidoCache("nope")).toBeNull();
  });
});
