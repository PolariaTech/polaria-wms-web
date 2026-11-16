import { describe, expect, it } from "vitest";
import { resolveOtIdParaLineaNueva } from "./editar-lineas-ov";

describe("resolveOtIdParaLineaNueva (REQ-311)", () => {
  it("usa la OT activa del pager si hay", () => {
    expect(
      resolveOtIdParaLineaNueva({
        hijaFormActivaId: "ot-2",
        ordenesTrabajoIds: ["ot-1", "ot-2"],
      }),
    ).toBe("ot-2");
  });

  it("con 1 OT y sin pager (activa null) liga a esa OT", () => {
    expect(
      resolveOtIdParaLineaNueva({
        hijaFormActivaId: null,
        ordenesTrabajoIds: ["manual:ot-unica"],
      }),
    ).toBe("manual:ot-unica");
  });

  it("con varias OT y sin activa no inventa otId", () => {
    expect(
      resolveOtIdParaLineaNueva({
        hijaFormActivaId: null,
        ordenesTrabajoIds: ["ot-1", "ot-2"],
      }),
    ).toBeUndefined();
  });
});
