import { describe, expect, it } from "vitest";
import type { OrigenCorreoRenglon } from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  aplicarCabeceraFormARenglonActivo,
  aplicarCabeceraOvARenglonHermano,
} from "./sync-ot-cabecera-renglon";

const base: OrigenCorreoRenglon = {
  Producto: "TOMATE",
  Cantidad: 10,
  Unidad: "KGS",
  Almacen: "COCINA A",
  "Numero pedido": "OC-OLD",
  Fecha: "2026-01-10",
  "Responsable externo": "Ana",
  "Telefono contacto": "555111",
  "Correo contacto": "ana@old.com",
  "Direccion entrega": "Calle Vieja 1",
  Destino: "Calle Vieja 1",
  Anden: "A1",
  "Ventana desde": "08:00",
  "Ventana hasta": "10:00",
  "Notas generales": "Notas viejas",
  Prioridad: "Normal",
};

describe("aplicarCabeceraFormARenglonActivo (REQ-281)", () => {
  it("persiste vacío del form (no deja el valor viejo del origen)", () => {
    const next = aplicarCabeceraFormARenglonActivo(base, {
      almacen: "COCINA B",
      numeroPedido: "OC-NEW",
      fecha: "2026-03-01",
      responsableExterno: "",
      telefonoOt: "",
      correoOt: "",
      direccionOt: "",
      andenOt: "B2",
      ventanaDesdeOt: "09:00",
      ventanaHastaOt: "11:00",
      notasOt: "",
      prioridadOt: "Urgente",
    });
    expect(next["Responsable externo"]).toBe("");
    expect(next["Telefono contacto"]).toBe("");
    expect(next["Correo contacto"]).toBe("");
    expect(next["Direccion entrega"]).toBe("");
    expect(next.Destino).toBe("");
    expect(next["Notas generales"]).toBe("");
    expect(next.Almacen).toBe("COCINA B");
    expect(next["Numero pedido"]).toBe("OC-NEW");
  });

  it("limpia OC basura OCR cuando el form no trae número", () => {
    const conBasura: OrigenCorreoRenglon = {
      ...base,
      "Numero pedido": "rAutorizado",
    };
    const next = aplicarCabeceraFormARenglonActivo(conBasura, {
      almacen: "COCINA A",
      numeroPedido: "",
      fecha: "",
      responsableExterno: "Ana",
      telefonoOt: "555",
      correoOt: "a@b.c",
      direccionOt: "X",
      andenOt: "",
      ventanaDesdeOt: "",
      ventanaHastaOt: "",
      notasOt: "n",
      prioridadOt: "",
    });
    expect(next["Numero pedido"]).toBe("");
  });
});

describe("aplicarCabeceraOvARenglonHermano (REQ-281)", () => {
  it("propaga vacío de cabecera OV a OT hermanas", () => {
    const next = aplicarCabeceraOvARenglonHermano(base, {
      notasOt: "",
      direccionOt: "",
      telefonoOt: "",
      correoOt: "",
      responsableExterno: "",
    });
    expect(next["Notas generales"]).toBe("");
    expect(next["Direccion entrega"]).toBe("");
    expect(next.Destino).toBe("");
    expect(next["Telefono contacto"]).toBe("");
    expect(next["Correo contacto"]).toBe("");
    expect(next["Responsable externo"]).toBe("");
    expect(next.Almacen).toBe("COCINA A");
  });
});
