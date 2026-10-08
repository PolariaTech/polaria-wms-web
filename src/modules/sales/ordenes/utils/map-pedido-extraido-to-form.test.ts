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
    expect(mapped.observaciones).toMatch(/Entrega 27 DE AGOSTO DE 2026/i);
    expect(mapped.observaciones).toMatch(/Destino:\s*Parque Xcaret/i);
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

  it("si Mateo/SKU encuentra el producto, lo asigna aunque existan variantes de la familia", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "AGUACATE EXTRA (200 a 260g)",
            productoCatalogo: "AGUACATE EXTRA (200 a 250g) (115001005)",
            cantidad: 10,
            unidad: "KGM",
            cajas: null,
            presentacion: null,
            especificacion: "Amarillo",
            numeroPedido: null,
            almacen: null,
            numeroAlmacen: null,
            referenciaPedido: null,
            codigoProductoCliente: "115001005",
            responsableExterno: null,
            precioUnitario: 53,
          },
        ],
      },
      productos: [
        {
          idProducto: "p-extra",
          label: "AGUACATE EXTRA (200 a 250g) (115001005)",
          idCliente: null,
          idBodega: "b1",
          codigo: "115001005",
          nombre: "AGUACATE EXTRA (200 a 250g)",
          kgDisponible: 100,
          precioUnitario: 53,
          unidadMedida: "kg",
        },
        {
          idProducto: "p-med",
          label: "AGUACATE MEDIANO (140 a 170g) (115001004)",
          idCliente: null,
          idBodega: "b1",
          codigo: "115001004",
          nombre: "AGUACATE MEDIANO (140 a 170g)",
          kgDisponible: 80,
          precioUnitario: 48,
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
      todayIso: "2026-09-06",
    });

    expect(mapped.lineas[0]?.catalogPending).toBe(false);
    expect(mapped.lineas[0]?.idProducto).toBe("p-extra");
    expect(mapped.lineas[0]?.sugerencia).toBeNull();
  });

  it("aunque Mateo asigne clave exacta, pide confirmación si hay typo/vecino (jass/hass)", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "AGUACATE JASS",
            productoCatalogo: "AGUACATE JASS (X200011700)",
            cantidad: 37,
            unidad: "KGM",
            cajas: null,
            presentacion: null,
            especificacion: "STOCK",
            numeroPedido: null,
            almacen: null,
            numeroAlmacen: null,
            referenciaPedido: null,
            codigoProductoCliente: null,
            responsableExterno: null,
            precioUnitario: 78,
          },
        ],
      },
      productos: [
        {
          idProducto: "p-jass",
          label: "AGUACATE JASS (X200011700)",
          idCliente: null,
          idBodega: "b1",
          codigo: "X200011700",
          nombre: "AGUACATE JASS",
          kgDisponible: 0,
          precioUnitario: 78,
          unidadMedida: "kg",
        },
        {
          idProducto: "p-hass",
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
      todayIso: "2026-09-06",
    });

    expect(mapped.lineas[0]?.catalogPending).toBe(true);
    expect(mapped.lineas[0]?.catalogAmbiguo).toBe(true);
    expect(mapped.lineas[0]?.sugerencia?.idProducto).toBe("p-jass");
    expect(
      mapped.lineas[0]?.sugerenciasAlternativas?.some(
        (s) => s.idProducto === "p-hass",
      ),
    ).toBe(true);
  });

  it("resuelve por codigoProductoCliente cuando coincide un SKU único", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "producto hotel",
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
            codigoProductoCliente: "SKU-1",
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
      todayIso: "2026-09-06",
    });

    expect(mapped.lineas[0]?.catalogPending).toBe(false);
    expect(mapped.lineas[0]?.idProducto).toBe("p1");
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
      todayIso: "2026-09-06",
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
      todayIso: "2026-09-06",
    });

    expect(mapped.direccion).toBe("Calle nueva");
    expect(mapped.missingFields.has("direccion")).toBe(false);
    expect(mapped.missingFields.has("contacto")).toBe(false);
    expect(mapped.missingFields.has("telefono")).toBe(false);
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
        aceptaSustituciones: "No — surtir parcial",
        requiereLote: "No",
        registrarTemperatura: "No",
        observaciones: "",
      },
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });

    expect(mapped.direccion).toBe("Av. Solución 123, Parque Xcaret");
    expect(mapped.warnFields.has("direccion")).toBe(true);
    expect(
      mapped.discrepancias.some((d) => d.campo === "Dirección de entrega"),
    ).toBe(true);
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
});
