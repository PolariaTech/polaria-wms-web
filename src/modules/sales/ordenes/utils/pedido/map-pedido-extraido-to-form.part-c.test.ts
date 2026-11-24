import { describe, expect, it } from "vitest";
import { mapPedidoExtraidoToForm } from "./map-pedido-extraido-to-form";
import { emptyPedido } from "./map-pedido-extraido-to-form.test-helpers";

describe("mapPedidoExtraidoToForm", () => {

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
    expect(mapped.lineas[0]?.sugerencia?.idProducto).toBe("p-jass");
    expect(
      mapped.lineas[0]?.sugerenciasAlternativas?.some(
        (s) => s.idProducto === "p-hass",
      ),
    ).toBe(true);
  });

  // El texto genérico con un SKU ya no se asigna solo (REQ-299).

  it("resuelve por codigoProductoCliente cuando coincide un SKU único", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          {
            textoOriginal: "Aguacate Hass",
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

});
