import { describe, expect, it } from "vitest";
import { postprocesarPedido } from "./openai-pedido.postproceso";

describe("postprocesarPedido REQ-369 cantidad vs cajas", () => {
  it("no deja que 20×1.5 kg pisen cantidad 3 del PDF", () => {
    const raw = JSON.stringify({
      nombreCliente: null,
      ordenCompraHotel: null,
      centroConsumo: null,
      fechaEntregaTexto: null,
      horarioDesde: null,
      horarioHasta: null,
      observaciones: null,
      notasGeneralesAlmacen: null,
      rfc: null,
      direccion: null,
      anden: null,
      contacto: null,
      telefono: null,
      correo: null,
      regimen: null,
      tolerincia: null,
      sustituciones: null,
      lote: null,
      temperatura: null,
      advertencia: null,
      cuerpoMensaje: [],
      lineas: [
        {
          textoOriginal: "LECHUGA LARGA",
          productoCatalogo: null,
          cantidad: 3,
          unidad: "KGM",
          cajas: 20,
          presentacion: "Caja 1.5 kg",
          especificacion: null,
          numeroPedido: null,
          almacen: null,
          numeroAlmacen: null,
          referenciaPedido: null,
          codigoProductoCliente: null,
          responsableExterno: null,
          precioUnitario: 27,
        },
      ],
    });

    const pedido = postprocesarPedido({
      raw,
      texto: "pedido prueba",
      archivosExtraidos: [],
      archivosTexto: [],
      hoyISO: "2026-11-19",
      catalogoClaves: [],
      archivosNoLegibles: [],
    });

    expect(pedido.lineas).toHaveLength(1);
    expect(pedido.lineas[0]?.cantidad).toBe(3);
    expect(pedido.lineas[0]?.cajas).toBeNull();
    expect(pedido.lineas[0]?.presentacion).toBeNull();
  });

  it("realinea lineas al orden del PDF cuando Mateo las emite desordenadas (REQ-370)", () => {
    const raw = JSON.stringify({
      nombreCliente: null,
      ordenCompraHotel: null,
      centroConsumo: null,
      fechaEntregaTexto: null,
      horarioDesde: null,
      horarioHasta: null,
      observaciones: null,
      notasGeneralesAlmacen: null,
      rfc: null,
      direccion: null,
      anden: null,
      contacto: null,
      telefono: null,
      correo: null,
      regimen: null,
      tolerancia: null,
      sustituciones: null,
      lote: null,
      temperatura: null,
      advertencia: null,
      cuerpoMensaje: [],
      lineas: [
        {
          textoOriginal: "AGUACATE HASS",
          productoCatalogo: null,
          cantidad: 5,
          unidad: "KGM",
          cajas: null,
          presentacion: null,
          especificacion: null,
          numeroPedido: null,
          almacen: null,
          numeroAlmacen: null,
          referenciaPedido: null,
          codigoProductoCliente: null,
          responsableExterno: null,
          precioUnitario: null,
        },
        {
          textoOriginal: "LECHUGA OREJONA",
          productoCatalogo: null,
          cantidad: 3,
          unidad: "KGM",
          cajas: null,
          presentacion: null,
          especificacion: null,
          numeroPedido: null,
          almacen: null,
          numeroAlmacen: null,
          referenciaPedido: null,
          codigoProductoCliente: null,
          responsableExterno: null,
          precioUnitario: null,
        },
        {
          textoOriginal: "TOMATE SALADETTE",
          productoCatalogo: null,
          cantidad: 10,
          unidad: "KGM",
          cajas: null,
          presentacion: null,
          especificacion: null,
          numeroPedido: null,
          almacen: null,
          numeroAlmacen: null,
          referenciaPedido: null,
          codigoProductoCliente: null,
          responsableExterno: null,
          precioUnitario: null,
        },
      ],
    });

    const pdfTexto = [
      "Pedido Hard Rock",
      "LECHUGA OREJONA 3 KG",
      "TOMATE SALADETTE 10 KG",
      "AGUACATE HASS 5 KG",
      "Total pedido MXN 1000",
    ].join("\n");

    const pedido = postprocesarPedido({
      raw,
      texto: "correo corto",
      archivosExtraidos: [],
      archivosTexto: [{ nombre: "oc.pdf", contenido: pdfTexto }],
      hoyISO: "2026-11-19",
      catalogoClaves: [],
      archivosNoLegibles: [],
    });

    expect(pedido.lineas.map((l) => l.textoOriginal)).toEqual([
      "LECHUGA OREJONA",
      "TOMATE SALADETTE",
      "AGUACATE HASS",
    ]);
    expect(pedido.origenCorreo.map((r) => r.Producto)).toEqual([
      "LECHUGA OREJONA",
      "TOMATE SALADETTE",
      "AGUACATE HASS",
    ]);
  });
});
