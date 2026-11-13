import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
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

function productoVenta(
  parcial: Pick<ProductoVentaOption, "idProducto" | "codigo" | "nombre"> & {
    frasesCliente?: readonly string[];
  },
): ProductoVentaOption {
  return {
    label: `${parcial.nombre} (${parcial.codigo})`,
    idCliente: null,
    idBodega: "b1",
    kgDisponible: 40,
    precioUnitario: 20,
    unidadMedida: "kg",
    ...parcial,
  };
}

const GRANNY = productoVenta({
  idProducto: "p-granny",
  codigo: "115001010",
  nombre: "MANZANA GRANNY SMITH",
  frasesCliente: ["Manzana verde"],
});
const AJO = productoVenta({
  idProducto: "p-ajo",
  codigo: "115001201",
  nombre: "AJO",
});
const EXTRA = productoVenta({
  idProducto: "p-aguacate-extra",
  codigo: "115001005",
  nombre: "AGUACATE EXTRA",
});
const PRIMERA = productoVenta({
  idProducto: "p-aguacate-primera",
  codigo: "115001009",
  nombre: "AGUACATE PRIMERA",
  frasesCliente: ["aguacate hass"],
});

function mapear(
  linea: {
    textoOriginal: string;
    productoCatalogo?: string | null;
    codigoProductoCliente?: string | null;
  },
  productos: ProductoVentaOption[],
) {
  return mapPedidoExtraidoToForm({
    pedido: {
      ...emptyPedido(),
      lineas: [
        {
          textoOriginal: linea.textoOriginal,
          productoCatalogo: linea.productoCatalogo ?? null,
          cantidad: 5,
          unidad: "KGM",
          cajas: null,
          presentacion: null,
          especificacion: null,
          numeroPedido: null,
          almacen: null,
          numeroAlmacen: null,
          referenciaPedido: null,
          codigoProductoCliente: linea.codigoProductoCliente ?? null,
          responsableExterno: null,
          precioUnitario: null,
        },
      ],
    },
    productos,
    ficha: fichaVacia,
    tomorrowIso: "2026-09-07",
    todayIso: "2026-09-06",
  });
}

describe("mapPedidoExtraidoToForm por frase del cliente", () => {
  it("CA4/CA1: Manzana verde con la frase queda asignada a GRANNY SMITH", () => {
    const mapped = mapear({ textoOriginal: "Manzana verde" }, [GRANNY, AJO]);
    expect(mapped.lineas[0]?.idProducto).toBe("p-granny");
    expect(mapped.lineas[0]?.catalogPending).toBe(false);
    expect(mapped.lineas[0]?.propuestaSistema).toEqual({
      producto: {
        idProducto: "p-granny",
        nombre: "MANZANA GRANNY SMITH",
        codigo: "115001010",
      },
      fuente: "frase",
    });
  });

  it("CA4/CA2: un texto sin frase queda igual que hoy, no por equivalencia", () => {
    const grannyConPedido = {
      ...GRANNY,
      frasesCliente: ["pedido especial hotel"],
    };
    const sinFrase = mapear({ textoOriginal: "pedido especial hotel" }, [
      { ...grannyConPedido, frasesCliente: undefined },
      AJO,
    ]);
    const conFrase = mapear({ textoOriginal: "pedido especial hotel" }, [
      grannyConPedido,
      AJO,
    ]);
    expect(sinFrase.lineas[0]?.idProducto).toBe("");
    expect(conFrase.lineas[0]?.idProducto).toBe("p-granny");
  });

  it("CA4/CA3: una frase ambigua no asigna nada", () => {
    const extraConFrase = { ...EXTRA, frasesCliente: ["Manzana verde"] };
    const mapped = mapear({ textoOriginal: "Manzana verde" }, [
      GRANNY,
      extraConFrase,
    ]);
    expect(mapped.lineas[0]?.idProducto).toBe("");
    expect(mapped.lineas[0]?.propuestaSistema).toEqual({
      producto: null,
      fuente: null,
    });
  });

  it("aguacate hass → PRIMERA aunque Mateo diga EXTRA", () => {
    const mapped = mapear(
      {
        textoOriginal: "aguacate hass",
        productoCatalogo: "AGUACATE EXTRA (115001005)",
      },
      [EXTRA, PRIMERA],
    );
    expect(mapped.lineas[0]?.idProducto).toBe("p-aguacate-primera");
    expect(mapped.lineas[0]?.catalogPending).toBe(false);
  });

  it("la frase se salta la guarda de vecinos", () => {
    const primeraJass = {
      ...PRIMERA,
      frasesCliente: ["aguacate jass"] as const,
    };
    const mapped = mapear(
      {
        textoOriginal: "aguacate jass",
        productoCatalogo: "AGUACATE EXTRA (115001005)",
      },
      [EXTRA, primeraJass],
    );
    expect(mapped.lineas[0]?.idProducto).toBe("p-aguacate-primera");
    expect(mapped.lineas[0]?.catalogAmbiguo).toBe(false);
  });

  it("un código único que contradice la frase manda el código", () => {
    const mapped = mapear(
      {
        textoOriginal: "aguacate hass",
        codigoProductoCliente: "115001005",
      },
      [EXTRA, PRIMERA],
    );
    expect(mapped.lineas[0]?.idProducto).toBe("p-aguacate-extra");
    expect(mapped.lineas[0]?.propuestaSistema?.fuente).toBe("codigo");
  });
});
