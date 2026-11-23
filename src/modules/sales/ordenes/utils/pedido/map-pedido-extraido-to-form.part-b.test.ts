import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import { mapPedidoExtraidoToForm } from "./map-pedido-extraido-to-form";
import {
  emptyPedido,
} from "./map-pedido-extraido-to-form.test-helpers";

describe("mapPedidoExtraidoToForm", () => {

  it("deja pendiente si no hay similitud razonable", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "xyzzy foobar desconocido",
            productoCatalogo: null,
            cantidad: 1,
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
      },
      productos: [
        {
          idProducto: "p1",
          label: "Aguacate Hass (SKU-1)",
          idCliente: null,
          idBodega: "b1",
          codigo: "SKU-1",
          nombre: "Aguacate Hass",
          kgDisponible: 100,
          precioUnitario: 50,
          unidadMedida: "kg",
        },
      ],
      ficha: {
        centroConsumo: "",
        ventanaDesde: "",
        ventanaHasta: "",
        direccion: "",
        anden: "",
        contacto: "",
        telefono: "",
        correo: "",
        aceptaSustituciones: "",
        requiereLote: "",
        registrarTemperatura: "",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });

    expect(mapped.lineas[0]?.catalogPending).toBe(true);
    expect(mapped.lineas[0]?.idProducto).toBe("");
    expect(mapped.lineas[0]?.sugerencia).toBeFalsy();
  });


  it("resuelve por SKU aunque la clave de Mateo venga con distinto casing", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "aguacate",
            productoCatalogo: "aguacate hass (sku-1)",
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
        ],
      },
      productos: [
        {
          idProducto: "p1",
          label: "Aguacate Hass (SKU-1)",
          idCliente: null,
          idBodega: "b1",
          codigo: "SKU-1",
          nombre: "Aguacate Hass",
          kgDisponible: 100,
          precioUnitario: 50,
          unidadMedida: "kg",
        },
      ],
      ficha: {
        centroConsumo: "",
        ventanaDesde: "",
        ventanaHasta: "",
        direccion: "",
        anden: "",
        contacto: "",
        telefono: "",
        correo: "",
        aceptaSustituciones: "",
        requiereLote: "",
        registrarTemperatura: "",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });

    expect(mapped.lineas[0]?.catalogPending).toBe(false);
    expect(mapped.lineas[0]?.idProducto).toBe("p1");
  });


  it("marca ambigüedad y ofrece alternativas cuando hay variantes parecidas", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "chile jalapeño",
            productoCatalogo: null,
            cantidad: 2,
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
      },
      productos: [
        {
          idProducto: "p3",
          label: "CHILE JALAPEÑO DE 6 A 8 CM (JAL01)",
          idCliente: null,
          idBodega: "b1",
          codigo: "JAL01",
          nombre: "CHILE JALAPEÑO DE 6 A 8 CM",
          kgDisponible: 50,
          precioUnitario: 33,
          unidadMedida: "kg",
        },
        {
          idProducto: "p4",
          label: "CHILE JALAPEÑO DE 8 A 10 CM (JAL02)",
          idCliente: null,
          idBodega: "b1",
          codigo: "JAL02",
          nombre: "CHILE JALAPEÑO DE 8 A 10 CM",
          kgDisponible: 40,
          precioUnitario: 35,
          unidadMedida: "kg",
        },
      ],
      ficha: {
        centroConsumo: "",
        ventanaDesde: "",
        ventanaHasta: "",
        direccion: "",
        anden: "",
        contacto: "",
        telefono: "",
        correo: "",
        aceptaSustituciones: "",
        requiereLote: "",
        registrarTemperatura: "",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });

    expect(mapped.lineas[0]?.catalogPending).toBe(true);
    expect(mapped.lineas[0]?.catalogAmbiguo).toBe(true);
    expect(mapped.lineas[0]?.sugerencia).toBeTruthy();
    expect(mapped.lineas[0]?.sugerenciasAlternativas?.length).toBeGreaterThanOrEqual(
      1,
    );
  });


  it("asigna por código en el texto aunque Mateo no mande productoCatalogo exacto", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "CEBOLLA BLANCA (115001413)",
            productoCatalogo: null,
            cantidad: 14,
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
            precioUnitario: 50,
          },
        ],
      },
      productos: [
        {
          idProducto: "p-ceb",
          label: "CEBOLLA BLANCA (115001413)",
          idCliente: null,
          idBodega: "b1",
          codigo: "115001413",
          nombre: "CEBOLLA BLANCA",
          kgDisponible: 100,
          precioUnitario: 50,
          unidadMedida: "kg",
        },
        {
          idProducto: "p-mor",
          label: "CEBOLLA MORADA (115001414)",
          idCliente: null,
          idBodega: "b1",
          codigo: "115001414",
          nombre: "CEBOLLA MORADA",
          kgDisponible: 80,
          precioUnitario: 55,
          unidadMedida: "kg",
        },
      ],
      ficha: {
        centroConsumo: "",
        ventanaDesde: "",
        ventanaHasta: "",
        direccion: "",
        anden: "",
        contacto: "",
        telefono: "",
        correo: "",
        aceptaSustituciones: "",
        requiereLote: "",
        registrarTemperatura: "",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });

    expect(mapped.lineas[0]?.catalogPending).toBe(false);
    expect(mapped.lineas[0]?.idProducto).toBe("p-ceb");
  });

});
