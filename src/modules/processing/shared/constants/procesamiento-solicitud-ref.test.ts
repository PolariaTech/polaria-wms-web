import { describe, expect, it } from "vitest";
import {
  buildProcesamientoSolicitudRef,
  parseProcesamientoSolicitudRef,
  solicitudProcesamientoTieneTareaCola,
} from "./procesamiento-solicitud-ref";

describe("procesamiento-solicitud-ref", () => {
  it("construye y parsea referencia de solicitud", () => {
    const id = "abc-123";
    const ref = buildProcesamientoSolicitudRef(id);
    expect(ref).toBe("solicitudProcesamiento:abc-123");
    expect(parseProcesamientoSolicitudRef(ref)).toBe(id);
    expect(
      parseProcesamientoSolicitudRef(`Retiro ${ref} · 10 kg`),
    ).toBe(id);
  });

  it("detecta tarea cola vinculada a solicitud", () => {
    const id = "sol-1";
    expect(
      solicitudProcesamientoTieneTareaCola(id, [
        {
          titulo: "Movimiento",
          descripcion: buildProcesamientoSolicitudRef(id),
        },
      ]),
    ).toBe(true);
    expect(
      solicitudProcesamientoTieneTareaCola(id, [
        { id_solicitud_procesamiento: id, titulo: "x" },
      ]),
    ).toBe(true);
    expect(solicitudProcesamientoTieneTareaCola(id, [])).toBe(false);
  });
});
