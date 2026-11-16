import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../../ai/openai-pedido.client";
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
  correo: null,
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

const fichaVacia = {
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
};

describe("mapPedidoExtraidoToForm REQ-311 pimiento vs pulpa/color", () => {
  const chileVerde = {
    idProducto: "chile-verde",
    label: "CHILE MORRON VERDE (115001200)",
    idCliente: null,
    idBodega: "b1",
    codigo: "115001200",
    nombre: "CHILE MORRON VERDE",
    kgDisponible: 50,
    precioUnitario: 40,
    unidadMedida: "KGM",
  };
  const chileRojo = {
    ...chileVerde,
    idProducto: "chile-rojo",
    label: "CHILE MORRON ROJO (115001201)",
    codigo: "115001201",
    nombre: "CHILE MORRON ROJO",
  };
  const chileAmarillo = {
    ...chileVerde,
    idProducto: "chile-amarillo",
    label: "CHILE MORRON AMARILLO (115001202)",
    codigo: "115001202",
    nombre: "CHILE MORRON AMARILLO",
  };
  const pulpa = {
    idProducto: "pulpa",
    label: "PULPA DE FRUTOS ROJOS (115001418)",
    idCliente: null,
    idBodega: "b1",
    codigo: "115001418",
    nombre: "PULPA DE FRUTOS ROJOS",
    kgDisponible: 10,
    precioUnitario: 80,
    unidadMedida: "KGM",
  };

  const linea = (
    textoOriginal: string,
    productoCatalogo: string | null,
  ): PedidoExtraido["lineas"][number] => ({
    textoOriginal,
    productoCatalogo,
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
  });

  it("nunca asigna PULPA a pimiento morrón ROJO", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          linea(
            "Pimiento morrón ROJO por kilo",
            "PULPA DE FRUTOS ROJOS (115001418)",
          ),
        ],
      },
      productos: [chileRojo, pulpa, chileVerde],
      ficha: fichaVacia,
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });
    expect(mapped.lineas[0]?.idProducto).not.toBe("pulpa");
    expect(mapped.lineas[0]?.idProducto).toBe("chile-rojo");
    expect(mapped.lineas[0]?.catalogPending).toBe(false);
  });

  it("Pimiento verde + clave PULPA → CHILE MORRON VERDE", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [linea("Pimiento verde", "PULPA DE FRUTOS ROJOS (115001418)")],
      },
      productos: [chileVerde, chileAmarillo, chileRojo, pulpa],
      ficha: fichaVacia,
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });
    expect(mapped.lineas[0]?.idProducto).toBe("chile-verde");
    expect(mapped.lineas[0]?.catalogPending).toBe(false);
  });

  it("Pimiento verde + clave AMARILLO no asigna amarillo", () => {
    const mapped = mapPedidoExtraidoToForm({
      pedido: {
        ...emptyPedido(),
        lineas: [
          linea("Pimiento verde", "CHILE MORRON AMARILLO (115001202)"),
        ],
      },
      productos: [chileVerde, chileAmarillo, chileRojo],
      ficha: fichaVacia,
      tomorrowIso: "2026-09-07",
      todayIso: "2026-09-06",
    });
    expect(mapped.lineas[0]?.idProducto).not.toBe("chile-amarillo");
    expect(mapped.lineas[0]?.idProducto).toBe("chile-verde");
  });
});
