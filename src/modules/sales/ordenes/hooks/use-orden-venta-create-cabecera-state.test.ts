import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOrdenVentaCreateCabeceraState } from "./use-orden-venta-create-cabecera-state";

describe("useOrdenVentaCreateCabeceraState (REQ-328)", () => {
  it("incluye referencia de pedido vacía y editable", () => {
    const { result } = renderHook(() => useOrdenVentaCreateCabeceraState());
    expect(result.current.referenciaPedido).toBe("");
    act(() => {
      result.current.setReferenciaPedido("REF-99");
    });
    expect(result.current.referenciaPedido).toBe("REF-99");
  });
});
