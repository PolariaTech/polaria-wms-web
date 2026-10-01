import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../ai/openai-pedido.client";
import { mapPedidoExtraidoToForm } from "./map-pedido-extraido-to-form";

const emptyPedido = (): PedidoExtraido => ({
  fechaEntrega: "2026-09-07",
  centroConsumo: null,
  observaciones: null,
  ordenCompraHotel: null,
  nombreCliente: null,
  rfc: null,
  regimen: null,
  direccion: null,
  anden: null,
  contacto: null,
  telefono: null,
  horarioDesde: null,
  horarioHasta: null,
  tolerancia: null,
  sustituciones: null,
  lote: null,
  temperatura: null,
  lineas: [],
  origenCorreo: [],
  advertencia: null,
  archivosNoLegibles: [],
});

describe("mapPedidoExtraidoToForm", () => {
  it("conserva la ficha del comprador si ya tiene valor (IA no pisa)", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        anden: "Andén 5",
        horarioDesde: "07:00",
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
        aceptaSustituciones: "No — surtir parcial",
        requiereLote: "No",
        registrarTemperatura: "No",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
    });

    expect(mapped.anden).toBe("Andén 1");
    expect(mapped.ventanaDesde).toBe("06:00");
    expect(mapped.warnFields.has("anden")).toBe(false);
    expect(mapped.discrepancias.some((d) => d.campo === "Andén")).toBe(true);
  });

  it("mapea líneas por clave de catálogo", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "aguacate",
            productoCatalogo: "Aguacate Hass (SKU-1)",
            cantidad: 40,
            unidad: "KGM",
            cajas: null,
            presentacion: null,
            especificacion: "firme",
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
        aceptaSustituciones: "",
        requiereLote: "",
        registrarTemperatura: "",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
    });

    expect(mapped.lineas).toHaveLength(1);
    expect(mapped.lineas[0]?.idProducto).toBe("p1");
    expect(mapped.lineas[0]?.cantidadInput).toBe("40");
    expect(mapped.lineas[0]?.cajasInput).toBe("2");
    expect(mapped.lineas[0]?.presentacion).toBe("Caja 20 kg");
    expect(mapped.lineas[0]?.aliasCliente).toBe("aguacate");
    expect(mapped.lineas[0]?.unidadMedida).toBe("kg");
    expect(mapped.lineas[0]?.otId).toBeTruthy();
    expect(mapped.missingFields.has("direccion")).toBe(true);
    expect(mapped.missingFields.has("contacto")).toBe(true);
  });

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
        aceptaSustituciones: "",
        requiereLote: "",
        registrarTemperatura: "",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
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
        aceptaSustituciones: "No — surtir parcial",
        requiereLote: "No",
        registrarTemperatura: "No",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
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
        aceptaSustituciones: "No — surtir parcial",
        requiereLote: "No",
        registrarTemperatura: "No",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
    });

    expect(mapped.direccion).toBe("Calle nueva");
    expect(mapped.missingFields.has("direccion")).toBe(false);
    expect(mapped.missingFields.has("contacto")).toBe(false);
    expect(mapped.missingFields.has("telefono")).toBe(false);
    expect(mapped.missingFields.size).toBe(0);
  });
});
