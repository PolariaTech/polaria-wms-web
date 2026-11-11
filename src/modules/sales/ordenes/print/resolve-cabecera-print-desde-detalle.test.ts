import { describe, expect, it } from "vitest";
import {
  resolveCentroConsumoDesdeDetalle,
  resolveFechaYDiaEntregaDesdeDetalle,
  resolveNotasGeneralesDesdeDetalle,
} from "./resolve-cabecera-print-desde-detalle";

describe("resolve-cabecera-print-desde-detalle (REQ-281 PDF)", () => {
  it("notas vacías en BD no reinyectan el correo", () => {
    expect(resolveNotasGeneralesDesdeDetalle("")).toBe("");
    expect(resolveNotasGeneralesDesdeDetalle("   ")).toBe("");
  });

  it("notas de almacén del detalle mandan", () => {
    expect(
      resolveNotasGeneralesDesdeDetalle("Traer solo dos facturas con la OC"),
    ).toMatch(/dos facturas/i);
  });

  it("centro vacío en BD no cae a Almacen de Mateo", () => {
    expect(
      resolveCentroConsumoDesdeDetalle({
        centroBd: "",
        centroCaptura: "",
      }),
    ).toBe("");
  });

  it("centro BD gana sobre captura", () => {
    expect(
      resolveCentroConsumoDesdeDetalle({
        centroBd: "Bar limpio",
        centroCaptura: "Cocina Mateo",
      }),
    ).toBe("Bar limpio");
  });

  it("fecha BD gana; sin Fecha de OT", () => {
    const conBd = resolveFechaYDiaEntregaDesdeDetalle({
      fechaCaptura: "2026-01-01",
      fechaEntregaBd: "2026-09-03T00:00:00.000Z",
      fechaPedido: "2026-06-28T12:00:00.000Z",
      createdAt: "2026-06-28T12:00:00.000Z",
    });
    expect(conBd.fechaEntrega).toBe("03/09/2026");

    const vacia = resolveFechaYDiaEntregaDesdeDetalle({
      fechaCaptura: "",
      fechaEntregaBd: "",
      fechaPedido: null,
      createdAt: null,
    });
    expect(vacia.fechaEntrega).toBe("");
  });
});
