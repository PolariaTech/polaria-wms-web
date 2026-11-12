import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { buildMaterializeOvDesdeOrigenPlan } from "../origen/materialize-ov-desde-origen";
import { mapPedidoExtraidoToForm } from "./map-pedido-extraido-to-form";

function producto(codigo: string, nombre: string): ProductoVentaOption {
  return {
    idProducto: codigo,
    label: `${nombre} (${codigo})`,
    idCliente: null,
    idBodega: "b1",
    codigo,
    nombre,
    kgDisponible: 10,
    precioUnitario: 1,
    unidadMedida: "kg",
  };
}

/** Catálogo mínimo con SKU reales de Demo que reproduce el empate. */
const CATALOGO: ProductoVentaOption[] = [
  ["115001418", "PULPA DE FRUTOS ROJOS"],
  ["10501542", "RECADO ROJO"],
  ["10501522", "CHILE MORRON AMARILLO"],
  ["10501531", "CHILE MORRON NARANJA"],
  ["10501521", "CHILE MORRON ROJO"],
  ["10501520", "CHILE MORRON VERDE"],
  ["115001436", "CHILE ANCHO"],
  ["115001009", "AGUACATE PRIMERA (170 a 200g)"],
  ["115001000", "AGUACATE  HASS"],
  ["115001005", "AGUACATE EXTRA (200 a 260g)"],
  ["115001406", "NARANJA"],
  ["10501544", "NARANJA DULCE VERACRUZ"],
  ["115001454", "NARANJA AMERICANA"],
  ["115001201", "AJO"],
  ["115001453", "AJO (BOTE 1000G)"],
  ["115001400", "LIMON PERSA (SIN SEMILLA)"],
  ["105001500", "BROCOLI"],
  ["115001413", "CEBOLLA BLANCA"],
  ["10501519", "PEPINO VERDE"],
  ["105001505", "ZARZAMORA"],
  ["105001547", "JUGO DE NARANJA"],
  ["105001548", "JUGO DE LIMON"],
  ["10501516", "CEBOLLA MORADA"],
  ["105001545", "CHILE SERRANO"],
  ["105001511", "PULPA DE MANGO"],
].map(([codigo, nombre]) => producto(codigo, nombre));

const NARANJAS = new Set(["115001406", "10501544", "115001454"]);
const FICHA = {
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

function pedidoVacio(): PedidoExtraido {
  return {
    fechaEntrega: "2026-11-12",
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
  };
}

function formulario(texto: string, codigoCliente: string | null = null) {
  const mapped = mapPedidoExtraidoToForm({
    pedido: {
      ...pedidoVacio(),
      lineas: [
        {
          textoOriginal: texto,
          productoCatalogo: null,
          cantidad: 5,
          unidad: "KGM",
          cajas: null,
          presentacion: null,
          especificacion: null,
          numeroPedido: "OC-1",
          almacen: null,
          numeroAlmacen: null,
          referenciaPedido: null,
          codigoProductoCliente: codigoCliente,
          responsableExterno: null,
          precioUnitario: null,
        },
      ],
    },
    productos: CATALOGO,
    ficha: FICHA,
    tomorrowIso: "2026-11-12",
    todayIso: "2026-11-11",
  });
  const linea = mapped.lineas[0];
  return {
    sku: linea?.catalogPending || !linea?.idProducto ? null : linea.idProducto,
    sugerencia: linea?.sugerencia?.codigo ?? null,
  };
}

function materializar(texto: string, codigoCliente: string | null = null) {
  const plan = buildMaterializeOvDesdeOrigenPlan({
    origenCorreo: [
      {
        Fecha: "2026-11-11",
        Precio: 10,
        Cantidad: 5,
        Producto: texto,
        "Codigo producto": codigoCliente ?? "",
        "Numero pedido": "OC-1",
        "Nombre cliente": "Demo",
      },
    ],
    productos: CATALOGO,
    compradores: [],
  });
  return plan.lineas[0]?.idProducto ?? null;
}

describe("familia ajena — casos reales (REQ-299)", () => {
  it("Pimiento rojo → CHILE MORRON ROJO, nunca PULPA, en los dos caminos", () => {
    expect(materializar("Pimiento rojo")).toBe("10501521");
    expect(formulario("Pimiento rojo").sku).toBe("10501521");
  });

  it("Naranja Primera + 0110N003 nunca asigna AGUACATE PRIMERA", () => {
    const texto = "Naranja Primera (10 cm diam jugosa, piel lisa)";
    const mat = materializar(texto, "0110N003");
    const form = formulario(texto, "0110N003");
    expect(mat).not.toBe("115001009");
    expect(form.sku).not.toBe("115001009");
    expect(form.sugerencia).not.toBe("115001009");
    if (mat) expect(NARANJAS.has(mat)).toBe(true);
    if (form.sku) expect(NARANJAS.has(form.sku)).toBe(true);
    if (!form.sku && form.sugerencia) {
      expect(NARANJAS.has(form.sugerencia)).toBe(true);
    }
  });

  it("Pimiento morrón AMARILLO por kilo → CHILE MORRON AMARILLO", () => {
    const texto = "Pimiento morrón AMARILLO por kilo";
    expect(materializar(texto)).toBe("10501522");
    expect(formulario(texto).sku).toBe("10501522");
  });

  it("Pimiento verde → CHILE MORRON VERDE", () => {
    expect(materializar("Pimiento verde")).toBe("10501520");
    expect(formulario("Pimiento verde").sku).toBe("10501520");
  });
});

describe("familia ajena — controles que no deben cambiar", () => {
  it.each([
    ["limón", "115001400"],
    ["brócoli pata corta", "105001500"],
    ["Cebolla Blanca", "115001413"],
    ["Pepino", "10501519"],
    ["zarzamora", "105001505"],
    ["Jugo de Naranja", "105001547"],
    ["Jugo de limón", "105001548"],
    ["Cebolla morada", "10501516"],
    ["Chile serrano", "105001545"],
    ["Pulpa de mango", "105001511"],
  ] as const)("%s → %s en los dos caminos", (texto, sku) => {
    expect(materializar(texto)).toBe(sku);
    expect(formulario(texto).sku).toBe(sku);
  });

  it("AGUACATE HASS PRIMERA no sale de la familia aguacate", () => {
    const mat = materializar("AGUACATE HASS PRIMERA");
    const form = formulario("AGUACATE HASS PRIMERA");
    const familia = new Set(["115001000", "115001009", "115001005"]);
    if (mat) expect(familia.has(mat)).toBe(true);
    if (form.sku) expect(familia.has(form.sku)).toBe(true);
    if (form.sugerencia) expect(familia.has(form.sugerencia)).toBe(true);
  });

  it("Aguacate extra no se asigna a otra familia", () => {
    const mat = materializar("Aguacate extra");
    const form = formulario("Aguacate extra");
    if (mat) expect(mat).toBe("115001005");
    if (form.sku) expect(form.sku).toBe("115001005");
  });

  it("Ajo limpio por kilo en BOTE no se asigna a otra familia", () => {
    const ajo = new Set(["115001201", "115001453"]);
    const mat = materializar("Ajo limpio por kilo en BOTE");
    const form = formulario("Ajo limpio por kilo en BOTE");
    if (mat) expect(ajo.has(mat)).toBe(true);
    if (form.sku) expect(ajo.has(form.sku)).toBe(true);
  });

  it("Pepino + 115001005 no asigna AGUACATE EXTRA (REQ-299 padre)", () => {
    expect(materializar("Pepino", "115001005")).not.toBe("115001005");
    expect(formulario("Pepino", "115001005").sku).not.toBe("115001005");
    expect(formulario("Pepino", "115001005").sugerencia).not.toBe("115001005");
  });
});

describe("familia ajena — decisiones documentadas", () => {
  it("Frutos rojos asigna PULPA DE FRUTOS ROJOS: no hay frutos rojos frescos", () => {
    expect(materializar("Frutos rojos")).toBe("115001418");
    expect(formulario("Frutos rojos").sku).toBe("115001418");
  });

  it("morrón solo, sin chile ni pimiento, queda por validar", () => {
    expect(materializar("morrón")).toBeNull();
    expect(formulario("morrón").sku).toBeNull();
  });
});
