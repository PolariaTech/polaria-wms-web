import { describe, expectTypeOf, it } from "vitest";
import type { OvAccionesCtx } from "./ov-impresion-ctx";
import type { BusyAction, OvFeedback } from "./ov-impresion-feedback";

describe("OvAccionesCtx", () => {
  it("comparte el bloqueo síncrono y los setters de ocupado y feedback", () => {
    expectTypeOf<OvAccionesCtx["printingLockRef"]["current"]>().toEqualTypeOf<boolean>();
    expectTypeOf<OvAccionesCtx["setBusyAction"]>().parameter(0).not.toBeNever();
    expectTypeOf<OvAccionesCtx["setFeedback"]>().parameter(0).not.toBeNever();
  });

  it("los tipos de ocupado y feedback encajan con los setters", () => {
    expectTypeOf<BusyAction["kind"]>().toEqualTypeOf<"print" | "preview" | "fotos" | "borrar">();
    expectTypeOf<OvFeedback["retry"]>().toBeNullable();
  });
});
