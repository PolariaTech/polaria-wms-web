import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFlujoDespacho } from "./despacho-publico-flujo";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("useFlujoDespacho", () => {
  it("guarda el nombre del QR y lo deja como default", () => {
    const { result } = renderHook(() => useFlujoDespacho());
    expect(result.current.defecto).toBeNull();
    act(() => result.current.setDespachador("  Ana  "));
    act(() => result.current.guardar());
    expect(result.current.defecto).toBe("Ana");
    expect(result.current.error).toBeNull();
  });

  it("rechaza el nombre vacío con el mensaje del schema", () => {
    const { result } = renderHook(() => useFlujoDespacho());
    act(() => result.current.guardar());
    expect(result.current.defecto).toBeNull();
    expect(result.current.error).toBe("Escribe quién despachó la mercancía.");
  });
});
