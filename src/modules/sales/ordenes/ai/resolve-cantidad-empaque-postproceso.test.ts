import { describe, expect, it } from "vitest";
import { resolverCantidadEmpaqueLineaPostproceso } from "./resolve-cantidad-empaque-postproceso";

describe("resolverCantidadEmpaqueLineaPostproceso (REQ-369)", () => {
  it("cantidad 3 KG manda sobre 20 cajas × 1.5 kg (=30)", () => {
    expect(
      resolverCantidadEmpaqueLineaPostproceso({
        cantidad: 3,
        cajas: 20,
        presentacion: "Caja 1.5 kg",
      }),
    ).toEqual({ cantidad: 3, cajas: null, presentacion: null });
  });

  it("cantidad 3 con cajas sin presentación: limpia cajas (evita default 1.5×N)", () => {
    expect(
      resolverCantidadEmpaqueLineaPostproceso({
        cantidad: 3,
        cajas: 20,
        presentacion: null,
      }),
    ).toEqual({ cantidad: 3, cajas: null, presentacion: null });
  });

  it("si cantidad y cajas×peso cuadran, conserva el empaque", () => {
    expect(
      resolverCantidadEmpaqueLineaPostproceso({
        cantidad: 15,
        cajas: 10,
        presentacion: "Caja 1.5 kg",
      }),
    ).toEqual({ cantidad: 15, cajas: 10, presentacion: "Caja 1.5 kg" });
  });

  it("sin cantidad total: sigue calculando desde cajas", () => {
    expect(
      resolverCantidadEmpaqueLineaPostproceso({
        cantidad: null,
        cajas: 10,
        presentacion: "Caja 1.5 kg",
      }),
    ).toEqual({ cantidad: 15, cajas: 10, presentacion: "Caja 1.5 kg" });
  });
});
