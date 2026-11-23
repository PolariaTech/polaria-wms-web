import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import { mapPedidoExtraidoToForm } from "./map-pedido-extraido-to-form";
import {
  emptyPedido,
} from "./map-pedido-extraido-to-form.test-helpers";

describe("mapPedidoExtraidoToForm", () => {

  it("permite el mismo producto en varias OT y usa precio del documento", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "CHILE JALAPEÑO DE 6 A 8 CM",
            productoCatalogo: "CHILE JALAPEÑO DE 6 A 8 CM (JAL01)",
            cantidad: 3,
            unidad: "KGM",
            cajas: null,
            presentacion: null,
            especificacion: null,
            numeroPedido: "4502949779",
            almacen: "BAWH Bar Whisky",
            numeroAlmacen: null,
            referenciaPedido: null,
            codigoProductoCliente: "1000580",
            responsableExterno: null,
            precioUnitario: 33,
          },
          {
            textoOriginal: "CHILE JALAPEÑO DE 6 A 8 CM",
            productoCatalogo: "CHILE JALAPEÑO DE 6 A 8 CM (JAL01)",
            cantidad: 1,
            unidad: "KGM",
            cajas: null,
            presentacion: null,
            especificacion: null,
            numeroPedido: "4502949779",
            almacen: "COPM Coc Plaza Mx",
            numeroAlmacen: null,
            referenciaPedido: null,
            codigoProductoCliente: "1000580",
            responsableExterno: null,
            precioUnitario: 33,
          },
        ],
      },
      productos: [
        {
          idProducto: "p-jal",
          label: "CHILE JALAPEÑO DE 6 A 8 CM (JAL01)",
          idCliente: null,
          idBodega: "b1",
          codigo: "JAL01",
          nombre: "CHILE JALAPEÑO DE 6 A 8 CM",
          kgDisponible: 100,
          precioUnitario: 0,
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

    expect(mapped.lineas).toHaveLength(2);
    expect(mapped.lineas[0]?.otId).not.toBe(mapped.lineas[1]?.otId);
    expect(mapped.lineas[0]?.precioUnitario).toBe(33);
    expect(mapped.lineas[0]?.precioManual).toBe(true);
  });


  it("mapea ordenCompraHotel desde la IA", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        ordenCompraHotel: "CUNMC0046026",
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

    expect(mapped.ordenCompraHotel).toBe("CUNMC0046026");
    expect(mapped.autoFields.has("ordenCompraHotel")).toBe(true);
  });


  it("marca missing solo en campos operativos vacíos tras IA", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        direccion: "Calle nueva",
        contacto: "Luis",
        telefono: "5551234",
        correo: "luis@hotel.com",
      },
      productos: [],
      ficha: {
        centroConsumo: "Cocina",
        ventanaDesde: "06:00",
        ventanaHasta: "10:00",
        direccion: "",
        anden: "A1",
        contacto: "",
        telefono: "",
        correo: "",
        aceptaSustituciones: "No — surtir parcial",
        requiereLote: "No",
        registrarTemperatura: "No",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });

    expect(mapped.direccion).toBe("Calle nueva");
    expect(mapped.missingFields.has("direccion")).toBe(false);
    expect(mapped.missingFields.has("contacto")).toBe(false);
    expect(mapped.missingFields.has("telefono")).toBe(false);
    expect(mapped.missingFields.has("correo")).toBe(false);
    expect(mapped.missingFields.size).toBe(0);
  });


  it("prioriza dirección de la solicitud sobre la ficha del comprador", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        direccion: "Av. Solución 123, Parque Xcaret",
      },
      productos: [],
      ficha: {
        centroConsumo: "Cocina",
        ventanaDesde: "06:00",
        ventanaHasta: "10:00",
        direccion: "No — entrega urbana local",
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

    expect(mapped.direccion).toBe("Av. Solución 123, Parque Xcaret");
    // Amarillo si IA ≠ ficha; el diálogo Inicial/Definitivo solo al editar a mano.
    expect(mapped.warnFields.has("direccion")).toBe(true);
    expect(
      mapped.discrepancias.some((d) => d.campo === "Dirección de entrega"),
    ).toBe(false);
  });


  it("usa dirección de ficha si la solicitud no trae ninguna", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: emptyPedido(),
      productos: [],
      ficha: {
        centroConsumo: "Cocina",
        ventanaDesde: "06:00",
        ventanaHasta: "10:00",
        direccion: "Km 250 Carretera Federal",
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

    expect(mapped.direccion).toBe("Km 250 Carretera Federal");
  });


  it("marca fecha de entrega atrasada como advertencia, no como bloqueo", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        fechaEntrega: "2026-08-27",
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

    expect(mapped.fechaEntrega).toBe("2026-08-27");
    expect(mapped.warnFields.has("fechaEntrega")).toBe(true);
    expect(mapped.autoFields.has("fechaEntrega")).toBe(false);
    expect(mapped.discrepancias.some((d) => d.campo === "Fecha de entrega")).toBe(
      true,
    );
  });


  it("si no hay fecha leída, usa mañana pero lo marca como default explícito", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        fechaEntrega: null,
        textoOrigen: "Haga clic en Responder\nwww.accorlive.com",
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
      tomorrowIso: "2026-10-17",
      todayIso: "2026-10-16",
    });

    expect(mapped.fechaEntrega).toBe("2026-10-17");
    expect(mapped.warnFields.has("fechaEntrega")).toBe(true);
    expect(mapped.autoFields.has("fechaEntrega")).toBe(false);
    expect(
      mapped.discrepancias.some((d) =>
        d.ia.includes("Fecha por defecto (no leída del correo)"),
      ),
    ).toBe(true);
  });

});
