import { describe, expect, it } from "vitest";
import * as barrel from "./processing.service";
import * as part from "./processing.service.shared";

describe("processing.service.shared", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.SOLICITUD_PROC_COLUMNS_API).toBe(part.SOLICITUD_PROC_COLUMNS_API);
    expect(barrel.SOLICITUD_PROC_COLUMNS_SUPABASE).toBe(part.SOLICITUD_PROC_COLUMNS_SUPABASE);
    expect(barrel.TAREA_COLA_COLUMNS_SUPABASE).toBe(part.TAREA_COLA_COLUMNS_SUPABASE);
    expect(barrel.PRODUCTO_PROC_COLUMNS).toBe(part.PRODUCTO_PROC_COLUMNS);
    expect(barrel.parseDecimal).toBe(part.parseDecimal);
    expect(barrel.resolveMermaPct).toBe(part.resolveMermaPct);
    expect(barrel.mapProductoOption).toBe(part.mapProductoOption);
    expect(barrel.fetchProductoLabels).toBe(part.fetchProductoLabels);
    expect(barrel.generateProcesamientoCodigo).toBe(part.generateProcesamientoCodigo);
    expect(barrel.mapSolicitudOperadorRow).toBe(part.mapSolicitudOperadorRow);
  });
});
