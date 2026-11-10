import { describe, expect, it, vi } from "vitest";
import { buildOperadorOrdenesVentaColumns } from "./build-operador-ordenes-venta-columns";

describe("buildOperadorOrdenesVentaColumns (REQ-180)", () => {
  it("incluye columna OV y acciones fuera de inspect", () => {
    const cols = buildOperadorOrdenesVentaColumns({
      inspect: false,
      cypherId: null,
      idsCorreoNoEnviado: new Set(),
      setDetalleId: vi.fn(),
      setCypherId: vi.fn(),
    });
    expect(cols.map((c) => c.id)).toEqual([
      "venta",
      "occ",
      "comprador",
      "estado",
      "fecha",
      "ot",
      "acciones",
    ]);
  });
});
