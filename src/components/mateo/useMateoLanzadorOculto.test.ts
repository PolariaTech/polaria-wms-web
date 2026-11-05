import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLAVE_MATEO_LANZADOR_OCULTO,
  useMateoLanzadorOculto,
} from "./useMateoLanzadorOculto";

describe("useMateoLanzadorOculto", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("arranca visible", () => {
    const { result } = renderHook(() => useMateoLanzadorOculto());
    expect(result.current.oculto).toBe(false);
  });

  it("alternar esconde, lo guarda y devuelve el nuevo estado", () => {
    const { result } = renderHook(() => useMateoLanzadorOculto());
    let devuelto = false;
    act(() => {
      devuelto = result.current.alternar();
    });
    expect(devuelto).toBe(true);
    expect(result.current.oculto).toBe(true);
    expect(window.localStorage.getItem(CLAVE_MATEO_LANZADOR_OCULTO)).toBe("1");

    act(() => {
      devuelto = result.current.alternar();
    });
    expect(devuelto).toBe(false);
    expect(window.localStorage.getItem(CLAVE_MATEO_LANZADOR_OCULTO)).toBe("0");
  });

  it("al volver a entrar respeta lo que se guardó", () => {
    window.localStorage.setItem(CLAVE_MATEO_LANZADOR_OCULTO, "1");
    const { result } = renderHook(() => useMateoLanzadorOculto());
    expect(result.current.oculto).toBe(true);
  });

  it("si el almacenamiento falla, no se cae y el cambio de la sesión aplica", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    const { result } = renderHook(() => useMateoLanzadorOculto());
    expect(result.current.oculto).toBe(false);
    act(() => {
      result.current.alternar();
    });
    expect(result.current.oculto).toBe(true);
  });
});
