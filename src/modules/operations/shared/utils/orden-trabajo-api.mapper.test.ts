import { describe, expect, it } from "vitest";
import {
  extractOvCodigoFromText,
  mapOrdenTrabajoApiRow,
  mapTareaColaApiRow,
  textoReferenciaOrdenVenta,
} from "./orden-trabajo-api.mapper";

describe("orden-trabajo-api.mapper", () => {
  it("mapea id_orden_venta en snake_case", () => {
    const row = mapOrdenTrabajoApiRow({
      id_orden_trabajo: "ot-1",
      codigo_cuenta: "CUENTA",
      id_bodega: "bod-1",
      codigo: "OT-001",
      estado: "pendiente",
      tipo: "orden",
      tipo_flujo: "a_salida",
      id_orden_venta: "ov-99",
      observaciones: "OV OV-20260709-160103",
      created_at: "2026-07-09T12:00:00.000Z",
      updated_at: "2026-07-09T12:00:00.000Z",
    });

    expect(row.idOrdenTrabajo).toBe("ot-1");
    expect(row.idOrdenVenta).toBe("ov-99");
    expect(row.tipoFlujo).toBe("a_salida");
  });

  it("detecta referencia OV en observaciones", () => {
    expect(textoReferenciaOrdenVenta("OV OV-20260709-160103")).toBe(true);
    expect(textoReferenciaOrdenVenta("Mover pallet A-01")).toBe(false);
  });

  it("extrae código OV desde texto", () => {
    expect(extractOvCodigoFromText("OV OV-20260709-160103")).toBe(
      "OV-20260709-160103",
    );
    expect(extractOvCodigoFromText("sin referencia")).toBeNull();
  });

  it("mapea tarea_cola en snake_case", () => {
    const row = mapTareaColaApiRow({
      id_tarea: "t-1",
      codigo_cuenta: "CUENTA",
      id_bodega: "bod-1",
      tipo: "despacho",
      estado: "pendiente",
      id_orden_trabajo: "ot-1",
      titulo: "Despacho venta OV-001",
      created_at: "2026-07-09T12:00:00.000Z",
      updated_at: "2026-07-09T12:00:00.000Z",
    });

    expect(row.id_tarea).toBe("t-1");
    expect(row.id_orden_trabajo).toBe("ot-1");
    expect(row.titulo).toBe("Despacho venta OV-001");
  });
});
