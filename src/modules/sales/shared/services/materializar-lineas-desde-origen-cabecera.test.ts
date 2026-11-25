import { describe, expect, it } from "vitest";
import type { MaterializeOvPlan } from "../../ordenes/utils/origen/materialize-ov-desde-origen";
import {
  buildCabeceraPatchDesdeOrigen,
  buildFilasInsertarOrdenVentaLinea,
  extraerCorreoContactoDesdeOrigen,
  necesitaMaterializarCabecera,
  type OrdenVentaHeaderMaterializacion,
} from "./materializar-lineas-desde-origen-cabecera";

const HEADER_VACIO: OrdenVentaHeaderMaterializacion = {
  estado: "por_confirmar",
  id_comprador: null,
  orden_compra_hotel: null,
  centro_consumo: null,
  contacto_entrega: null,
  correo_contacto: null,
  fecha_entrega: null,
  notas_lineas: null,
  origen_correo: [],
  origen_texto: null,
};

const PLAN_BASE: MaterializeOvPlan = {
  idComprador: "comp-1",
  ordenCompraHotel: "OC-999",
  centroConsumo: "COCINA",
  contactoEntrega: "Laura",
  fechaEntrega: "2026-11-25",
  lineas: [],
  sinMatchProductos: [],
  nombreClienteOrigen: "Hotel Demo",
};

describe("necesitaMaterializarCabecera", () => {
  it("devuelve true si falta id_comprador aunque exista sello", () => {
    expect(necesitaMaterializarCabecera(HEADER_VACIO, false)).toBe(true);
  });

  it("respeta el sello de usuario cuando id_comprador ya existe", () => {
    const header = { ...HEADER_VACIO, id_comprador: "comp-1" };
    expect(necesitaMaterializarCabecera(header, false)).toBe(false);
    expect(necesitaMaterializarCabecera(header, true)).toBe(true);
  });
});

describe("extraerCorreoContactoDesdeOrigen", () => {
  it("extrae el primer correo de contacto no vacío del origen", () => {
    expect(
      extraerCorreoContactoDesdeOrigen([
        { Producto: "A", "Correo contacto": "   " },
        { Producto: "B", "Correo contacto": " compras@hotel.mx " },
      ]),
    ).toBe("compras@hotel.mx");
  });

  it("devuelve cadena vacía si ningún renglón trae correo", () => {
    expect(extraerCorreoContactoDesdeOrigen([{ Producto: "A" }])).toBe("");
  });
});

describe("buildCabeceraPatchDesdeOrigen", () => {
  it("completa todos los campos faltantes cuando no hay sello", () => {
    const patch = buildCabeceraPatchDesdeOrigen({
      header: HEADER_VACIO,
      plan: PLAN_BASE,
      origen: [{ "Correo contacto": "chef@hotel.mx" }],
      sinSello: true,
    });

    expect(patch).toEqual({
      id_comprador: "comp-1",
      orden_compra_hotel: "OC-999",
      centro_consumo: "COCINA",
      contacto_entrega: "Laura",
      fecha_entrega: "2026-11-25",
      correo_contacto: "chef@hotel.mx",
    });
  });

  it("con sello solo rellena id_comprador si falta y no sobreescribe otros campos", () => {
    const patch = buildCabeceraPatchDesdeOrigen({
      header: HEADER_VACIO,
      plan: PLAN_BASE,
      origen: [{ "Correo contacto": "chef@hotel.mx" }],
      sinSello: false,
    });

    expect(patch).toEqual({ id_comprador: "comp-1" });
  });
});

describe("buildFilasInsertarOrdenVentaLinea", () => {
  it("normaliza precio negativo/cero y unidad vacía al armar filas de inserción", () => {
    const filas = buildFilasInsertarOrdenVentaLinea("ov-1", [
      {
        idProducto: "prod-1",
        cantidadPedida: 4,
        precioUnitario: -10,
        unidadMedida: "  ",
        aliasCliente: "Tomate",
        codigoProductoCliente: "T1",
        nombreProducto: "Jitomate",
        especificacion: "",
        matchProducto: {
          estado: "pendiente",
          aliasCliente: "Tomate",
          codigoCliente: "T1",
        },
      },
    ]);

    expect(filas).toEqual([
      {
        id_orden_venta: "ov-1",
        id_producto: "prod-1",
        cantidad_pedida: 4,
        precio_unitario: 0,
        cajas: null,
        presentacion: null,
        unidad_medida: null,
        match_producto: {
          estado: "pendiente",
          aliasCliente: "Tomate",
          codigoCliente: "T1",
        },
      },
    ]);
  });
});
