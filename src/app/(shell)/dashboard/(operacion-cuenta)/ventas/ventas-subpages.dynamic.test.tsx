import { describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function DynamicStub() {
      return null;
    },
}));

describe("ventas subpages (dynamic)", () => {
  it("exporta subrutas de ventas con carga diferida", async () => {
    const pages = await Promise.all([
      import("./impresion-rapida/page"),
      import("./impresion-detallada/page"),
      import("./correos-mateo/page"),
      import("./correos-descartados/page"),
      import("./codigo-despacho/page"),
      import("./estado-fotos/page"),
      import("./ordenes/page"),
    ]);

    for (const page of pages) {
      expect(typeof page.default).toBe("function");
    }
  });
});
