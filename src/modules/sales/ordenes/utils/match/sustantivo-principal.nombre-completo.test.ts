import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { buildMaterializeOvDesdeOrigenPlan } from "../origen/materialize-ov-desde-origen";
import { mapPedidoExtraidoToForm } from "../pedido/map-pedido-extraido-to-form";
import {
  productoConNombreCompletoEnTexto,
  rankSinFamiliaAjena,
} from "./sustantivo-principal";

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

const CATALOGO: ProductoVentaOption[] = [
  ["10501514", "JITOMATE BOLA"],
  ["10501518", "JITOMATE GUAJE"],
  ["105001529", "TOMATE CHERRY"],
  ["105001518", "TOMATE VERDE"],
  ["105001516", "CALABAZA ITALIANA"],
  ["10501543", "CALABAZA LOCAL"],
  ["115001445", "LECHUGA ITALIANA"],
  ["105001515", "MELON CHINO"],
  ["105001532", "MELON VALENCIANO"],
  ["105001523", "PLATANO MACHO"],
  ["115001405", "PLATANO TABASCO"],
  ["115001201", "AJO"],
  ["115001452", "AJO (BOTE 500G)"],
  ["115001453", "AJO (BOTE 1000G)"],
  ["115001000", "AGUACATE  HASS"],
  ["115001009", "AGUACATE PRIMERA (170 a 200g)"],
  ["115001005", "AGUACATE EXTRA (200 a 260g)"],
  ["115001406", "NARANJA"],
  ["115001454", "NARANJA AMERICANA"],
  ["10501544", "NARANJA DULCE VERACRUZ"],
  ["115001400", "LIMON PERSA (SIN SEMILLA)"],
  ["105001517", "LIMON EUREKA"],
  ["105001527", "MANZANA GOLDEN"],
  ["105001524", "MANZANA STARKING"],
  ["105001503", "FRESAS"],
  ["10501527", "FRESAS (DOMO)"],
  ["105001545", "CHILE SERRANO"],
].map(([codigo, nombre]) => producto(codigo, nombre));

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

function claro(texto: string) {
  return productoConNombreCompletoEnTexto(texto, CATALOGO)?.nombre ?? null;
}

describe("productoConNombreCompletoEnTexto (REQ-299)", () => {
  it("asigna el producto cuyo nombre completo está en el texto, con calificativos de sobra", () => {
    expect(claro("Tomate verde limpio por kilo (sin cascara)")).toBe(
      "TOMATE VERDE",
    );
    expect(claro("Tomate Verde/Tomatillo")).toBe("TOMATE VERDE");
    expect(claro("Calabaza Verde/Italiana")).toBe("CALABAZA ITALIANA");
    expect(claro("Melon Chino 3 kg aprox")).toBe("MELON CHINO");
    expect(claro("Platano macho amarillo por kilo")).toBe("PLATANO MACHO");
    expect(claro("Aguacate extra")).toBe("AGUACATE EXTRA (200 a 260g)");
  });

  it("no mezcla tomate con jitomate: el sinónimo no cuenta como nombre completo", () => {
    expect(claro("Tomate")).toBeNull();
    expect(claro("Jitomate")).toBeNull();
    expect(claro("Tomate saladet")).toBeNull();
    expect(claro("Tomate bola")).toBeNull();
  });

  it("no asigna cuando hay variantes reales en competencia", () => {
    expect(claro("limón")).toBeNull();
    expect(claro("Aguacate")).toBeNull();
    expect(claro("Aguacate Hass (de primera, en su punto)")).toBeNull();
    expect(claro("Ajo limpio por kilo en BOTE")).toBeNull();
    expect(claro("Manzana Verde")).toBeNull();
    expect(claro("Naranja Primera (10 cm diam jugosa, piel lisa)")).toBeNull();
    expect(claro("Naranja")).toBeNull();
    expect(claro("Chile")).toBeNull();
    expect(claro("Fresa primera")).toBeNull();
    expect(claro("Tomate verde y jitomate bola")).toBeNull();
  });

  it("no asigna si el sustantivo del texto no está en el nombre (pulpa, jugo…)", () => {
    expect(claro("Pulpa de calabaza italiana")).toBeNull();
    expect(claro("Jugo de melon chino")).toBeNull();
  });
});

describe("rankSinFamiliaAjena con nombre completo (REQ-299)", () => {
  it("pone el producto claro primero, sin ambigüedad y con ventaja sobre el resto", () => {
    const ranked = rankSinFamiliaAjena(
      "Tomate verde limpio por kilo (sin cascara)",
      CATALOGO,
    );
    expect(ranked.ambiguous).toBe(false);
    expect(ranked.best?.nombre).toBe("TOMATE VERDE");
    expect(ranked.candidates[0]!.score).toBeGreaterThanOrEqual(0.9);
    expect(
      ranked.candidates[0]!.score - ranked.candidates[1]!.score,
    ).toBeGreaterThanOrEqual(0.2);
  });

  it("respeta el límite y no deja repetido al producto claro", () => {
    const ranked = rankSinFamiliaAjena("Melon Chino 3 kg aprox", CATALOGO, {
      limit: 3,
    });
    const nombres = ranked.candidates.map((c) => c.producto.nombre);
    expect(ranked.candidates.length).toBeLessThanOrEqual(3);
    expect(new Set(nombres).size).toBe(nombres.length);
    expect(nombres[0]).toBe("MELON CHINO");
  });

  it("deja igual el ranking cuando no hay producto claro", () => {
    const ranked = rankSinFamiliaAjena("limón", CATALOGO);
    expect(ranked.ambiguous).toBe(true);
  });
});

describe("nombre completo — casos reales en los dos caminos", () => {
  it.each([
    ["Tomate verde limpio por kilo (sin cascara)", null, "105001518"],
    ["Tomate Verde/Tomatillo", "0110T010", "105001518"],
    ["Tomate verde * — Tomate verde limpio por kilo", null, "105001518"],
    ["Calabaza Verde/Italiana", "0110C008", "105001516"],
    ["Melon Chino 3 kg aprox", "0110M014", "105001515"],
    ["Platano macho amarillo por kilo", null, "105001523"],
  ] as const)("%s → %s", (texto, codigo, sku) => {
    expect(materializar(texto, codigo)).toBe(sku);
    expect(formulario(texto, codigo).sku).toBe(sku);
  });

  it.each([
    ["Tomate", null],
    ["Jitomate", null],
    ["Tomate saladet", null],
    ["Tomate bola", "10501514"],
    ["Platano", null],
    ["Melon", null],
    ["Calabaza", null],
    ["Manzana", null],
    ["Manzana Verde", null],
    ["Chile", "105001545"],
    ["Naranja", "115001406"],
    ["limón", null],
    ["Persa", "115001400"],
    ["Ajo limpio por kilo en BOTE", null],
    ["Aguacate Hass (de primera, en su punto)", null],
  ] as const)("control %s", (texto, sku) => {
    expect(materializar(texto)).toBe(sku);
    expect(formulario(texto).sku).toBe(sku);
  });
});
