import { describe, expect, it } from "vitest";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT,
  cabeceraOtDesdeHija,
} from "./cabecera-ot-desde-hija";

const hijaBase = (over: Partial<OrdenTrabajoHija> = {}): OrdenTrabajoHija => ({
  id: "ot-1",
  label: "OC-1 — COCINA",
  numeroPedido: "OC-1",
  almacen: "COCINA A",
  referenciaPedido: "",
  fecha: "2026-04-01",
  responsableExterno: "Ana",
  renglones: [
    {
      Producto: "TOMATE",
      Cantidad: 1,
      Unidad: "KGS",
      Almacen: "COCINA A",
      "Responsable externo": "Ana",
      "Telefono contacto": "555",
      "Correo contacto": "a@b.c",
      "Direccion entrega": "Calle 1",
      Anden: "A1",
      "Ventana desde": "08:00",
      "Ventana hasta": "10:00",
      Prioridad: "Normal",
      "Notas generales": "no debe salir en cab OT",
    },
  ],
  totalCantidad: 1,
  ...over,
});

describe("cabeceraOtDesdeHija (REQ-281)", () => {
  it("trae solo campos de OT (sin contacto/teléfono/correo)", () => {
    const cab = cabeceraOtDesdeHija(hijaBase());
    expect(cab).toEqual({
      almacen: "COCINA A",
      numeroPedido: "OC-1",
      fechaIso: "2026-04-01",
      anden: "A1",
      ventanaDesde: "08:00",
      ventanaHasta: "10:00",
      prioridad: "Normal",
    });
    expect(cab).not.toHaveProperty("contacto");
    expect(cab).not.toHaveProperty("telefono");
    expect(cab).not.toHaveProperty("correo");
    expect(cab).not.toHaveProperty("notas");
  });

  it("ignora OC basura OCR", () => {
    const cab = cabeceraOtDesdeHija(hijaBase({ numeroPedido: "rAutorizado" }));
    expect(cab.numeroPedido).toBe("");
  });

  it("lista campos OV que el pager no reinyecta", () => {
    expect(CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT).toEqual([
      "contacto",
      "telefono",
      "correo",
      "direccion",
      "notas",
    ]);
  });
});
