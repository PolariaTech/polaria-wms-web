import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import { mapPedidoExtraidoToForm } from "./map-pedido-extraido-to-form";
import {
  emptyPedido,
} from "./map-pedido-extraido-to-form.test-helpers";

describe("mapPedidoExtraidoToForm", () => {

  it("llena notas generales desde observaciones de la IA si notasGeneralesAlmacen viene vacío", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        observaciones: "Entregar completo · sin sustitutos",
        notasGeneralesAlmacen: null,
      },
      productos: [],
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

    expect(mapped.observaciones).toBe("Entregar completo · sin sustitutos");
    expect(mapped.autoFields.has("observaciones")).toBe(true);
  });


  it("prioriza notasGeneralesAlmacen sobre observaciones genéricas", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        observaciones: "nota larga del pedido",
        notasGeneralesAlmacen: "Maduro · andén 3",
      },
      productos: [],
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
        observaciones: "ficha",
      },
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });

    expect(mapped.observaciones).toBe("Maduro · andén 3");
  });


  it("no mete el cuerpo del correo en notas generales cuando viene de afuera", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        observaciones:
          "---------- Forwarded message ----------. De: Daniel Galvis. Date: jue.",
        notasGeneralesAlmacen: null,
        textoOrigen: [
          "Buenas tardes,",
          "Envío adjunto pedido para entregar el 27 DE AGOSTO DE 2026 en Parque Xcaret:",
          "Hora de entrega 6:00 am",
          "Favor de confirmar de recibido",
        ].join("\n"),
      },
      productos: [],
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

    expect(mapped.observaciones).not.toContain("Forwarded message");
    expect(mapped.observaciones).not.toContain("Daniel Galvis");
    // REQ-286: no inventar resumen Entrega/Destino desde el cuerpo del correo.
    expect(mapped.observaciones).not.toMatch(/Entrega 27 DE AGOSTO DE 2026/i);
    expect(mapped.observaciones).not.toMatch(/Destino:\s*Parque Xcaret/i);
  });


  it("la entrega del documento pisa la ficha; lo que Mateo no trae queda de ficha", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        anden: "Andén 5",
        horarioDesde: "07:00",
        contacto: "Luis del PDF",
      },
      productos: [],
      ficha: {
        centroConsumo: "Cocina",
        ventanaDesde: "06:00",
        ventanaHasta: "10:00",
        direccion: "Calle 1",
        anden: "Andén 1",
        contacto: "Ana",
        telefono: "555",
        correo: "",
        aceptaSustituciones: "No — surtir parcial",
        requiereLote: "No",
        registrarTemperatura: "No",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });

    expect(mapped.anden).toBe("Andén 5");
    expect(mapped.ventanaDesde).toBe("07:00");
    expect(mapped.contacto).toBe("Luis del PDF");
    expect(mapped.direccion).toBe("Calle 1");
    expect(mapped.telefono).toBe("555");
    expect(mapped.warnFields.has("anden")).toBe(true);
  });


  it("convierte galón de 5 L a cantidad LTR y precio por litro", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "Jugo de Limón fresco galón de 5 litros",
            productoCatalogo: "JUGO DE LIMON (105001548)",
            cantidad: 1,
            unidad: "UN",
            cajas: null,
            presentacion: null,
            especificacion: null,
            numeroPedido: "MYG-0015033",
            almacen: null,
            numeroAlmacen: null,
            referenciaPedido: null,
            codigoProductoCliente: null,
            responsableExterno: null,
            precioUnitario: 350,
          },
        ],
      },
      productos: [
        {
          idProducto: "jugo-1",
          label: "JUGO DE LIMON (105001548)",
          idCliente: null,
          idBodega: "b1",
          codigo: "105001548",
          nombre: "JUGO DE LIMON",
          kgDisponible: 100,
          precioUnitario: 0,
          unidadMedida: "LTR",
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

    expect(mapped.lineas[0]?.cantidadInput).toBe("5");
    expect(mapped.lineas[0]?.unidadMedida).toBe("LTR");
    expect(mapped.lineas[0]?.precioUnitario).toBe(70);
    expect(mapped.lineas[0]?.packHint).toMatch(/Envase/i);
    expect(mapped.lineas[0]?.especificacion).toBe("1x galón de 5 litros");
  });


  it("auto-asigna cuando la sugerencia es inequívoca", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "aguacate hass premium",
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

    expect(mapped.lineas).toHaveLength(1);
    expect(mapped.lineas[0]?.catalogPending).toBe(false);
    expect(mapped.lineas[0]?.idProducto).toBe("p1");
    expect(mapped.lineas[0]?.aliasCliente).toBe("aguacate hass premium");
    expect(mapped.lineas[0]?.cantidadInput).toBe("10");
  });

});
