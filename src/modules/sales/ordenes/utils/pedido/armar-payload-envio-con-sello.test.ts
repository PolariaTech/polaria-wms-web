import { describe, expect, it } from "vitest";
import { createEmptyOrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { armarPayloadEnvioConSelloUsuario } from "./armar-payload-envio-con-sello";
import { leerCabeceraUsuarioSello } from "./sellar-edicion-usuario-origen";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";

function linea(otId: string): LineaVentaForm {
  return {
    key: "l1",
    otId,
    idProducto: "p1",
    nombre: "Aguacate",
    codigo: "SKU-1",
    cantidadInput: "1",
    unidadMedida: "KG",
    precioInput: "10",
    especificacion: "",
    catalogPending: false,
  } as LineaVentaForm;
}

describe("armarPayloadEnvioConSelloUsuario (REQ-281)", () => {
  it("sella notas/centro/teléfono vacíos en origen_correo al guardar", () => {
    const hija = createEmptyOrdenTrabajoHija({
      id: "ot-1",
      almacen: "SUSHI",
    });
    const payload = armarPayloadEnvioConSelloUsuario({
      codigoCuenta: "demo",
      lineasParsed: [
        {
          idProducto: "p1",
          cantidad: 1,
          precioUnitario: 10,
          unidadMedida: "KG",
        },
      ],
      lineas: [linea("ot-1")],
      hijasSynced: [hija],
      origenCorreoDraft: [],
      idBodegaDestino: "b1",
      idComprador: "c1",
      fechaEntregaPersist: "2026-11-06",
      ventanaDesde: "",
      ventanaHasta: "",
      prioridad: "Normal",
      moneda: "MXN",
      ordenCompraHotel: "ADP-1",
      centroConsumo: "",
      vendedorNombre: "",
      bodegaDestinoLabel: "",
      direccion: "",
      anden: "",
      contacto: "",
      telefono: "",
      correo: "",
      turno: "",
      horaSalida: "",
      chofer: "",
      unidad: "",
      aceptaSustituciones: "",
      requiereLote: "",
      registrarTemperatura: "",
      persistOrigenTexto: "cuerpo",
      persistOrigenAdjuntos: [],
      compradorNombreIa: null,
      compradorLabel: "Cliente",
      observaciones: "",
      idCreador: "u1",
      isDraft: true,
    });
    const sello = leerCabeceraUsuarioSello(
      (payload.origenCorreo as Parameters<typeof leerCabeceraUsuarioSello>[0]) ??
        [],
    );
    expect(sello?.notasGenerales).toBe("");
    expect(sello?.centroConsumo).toBe("");
    expect(sello?.telefono).toBe("");
  });

  it("REQ-032: notas_almacen guarda el texto del form (no re-extrae el correo)", () => {
    const hija = createEmptyOrdenTrabajoHija({
      id: "ot-1",
      almacen: "SUSHI",
    });
    const editadas =
      "que su chofer traiga la OC impresa al momento de la entrega junto con su factura fiscal. Por favor traer únicamente dos facturas junto con la orden de compra";
    const payload = armarPayloadEnvioConSelloUsuario({
      codigoCuenta: "demo",
      lineasParsed: [
        {
          idProducto: "p1",
          cantidad: 1,
          precioUnitario: 10,
          unidadMedida: "KG",
        },
      ],
      lineas: [linea("ot-1")],
      hijasSynced: [hija],
      origenCorreoDraft: [],
      idBodegaDestino: "b1",
      idComprador: "c1",
      fechaEntregaPersist: "2026-11-06",
      ventanaDesde: "",
      ventanaHasta: "",
      prioridad: "Normal",
      moneda: "MXN",
      ordenCompraHotel: "ADP-1",
      centroConsumo: "Bar",
      vendedorNombre: "",
      bodegaDestinoLabel: "",
      direccion: "",
      anden: "",
      contacto: "",
      telefono: "",
      correo: "",
      turno: "",
      horaSalida: "",
      chofer: "",
      unidad: "",
      aceptaSustituciones: "",
      requiereLote: "",
      registrarTemperatura: "",
      persistOrigenTexto:
        "Adjunto le remito la orden de compra. En caso de haber faltantes, favor de mencionar.",
      persistOrigenAdjuntos: [],
      compradorNombreIa: null,
      compradorLabel: "Cliente",
      observaciones: editadas,
      idCreador: "u1",
      isDraft: true,
    });
    expect(payload.notasAlmacen).toMatch(/dos facturas/i);
    expect(payload.notasAlmacen).not.toMatch(/Adjunto le remito/i);
    const sello = leerCabeceraUsuarioSello(
      (payload.origenCorreo as Parameters<typeof leerCabeceraUsuarioSello>[0]) ??
        [],
    );
    expect(sello?.notasGenerales).toBe(editadas);
  });
});
