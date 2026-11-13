import { describe, expect, it } from "vitest";
import {
  mapDetalleLineasAForm,
  ovTieneLineasMaterializadas,
} from "./map-detalle-lineas-a-form";
import { createEmptyOrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { buildOrigenCorreoFromOrdenesYLineas } from "../origen/origen-correo-build-from-form";
import { indexIdProductoVerificadoOrigen } from "../origen/origen-correo-id-producto-verificado";
import { equivalenciasPorAprender } from "../match/aprender-equivalencias";

describe("ovTieneLineasMaterializadas (REQ-195)", () => {
  it("true solo si hay id_producto", () => {
    expect(ovTieneLineasMaterializadas([])).toBe(false);
    expect(ovTieneLineasMaterializadas([{ id_producto: "" }])).toBe(false);
    expect(
      ovTieneLineasMaterializadas([{ id_producto: "prod-1" }]),
    ).toBe(true);
  });
});

describe("REQ-201 verificaciones al grabar avance", () => {
  it("mapDetalleLineasAForm marca líneas BD como no pendientes", () => {
    const lineas = mapDetalleLineasAForm({
      detalleLineas: [
        {
          id_linea_orden_venta: "l1",
          id_orden_venta: "ov-1",
          id_producto: "prod-1",
          cantidad_pedida: 2,
          precio_unitario: 10,
          cajas: null,
          presentacion: null,
          unidad_medida: "KGM",
          match_producto: null,
          producto: {
            sku: "105",
            descripcion: "Pepino",
            metadatos_catalogo: null,
          },
        },
      ],
      productoRows: [
        {
          idProducto: "prod-1",
          codigo: "105",
          nombre: "Pepino",
          idBodega: "bod-1",
          kgDisponible: 100,
          unidadMedida: "KGM",
        },
      ],
      origenCorreoRows: [],
      idBodegaDetalle: "bod-1",
      notasLineas: "",
      hijas: [],
    });
    expect(lineas[0]?.catalogPending).toBe(false);
    expect(lineas[0]?.idProducto).toBe("prod-1");
    expect(lineas[0]?.propuestaSistema).toEqual({
      producto: { idProducto: "prod-1", nombre: "Pepino", codigo: "105" },
      fuente: null,
    });
  });

  it("lee propuestaSistema del formato nuevo de match_producto", () => {
    const lineas = mapDetalleLineasAForm({
      detalleLineas: [
        {
          id_linea_orden_venta: "l1",
          id_orden_venta: "ov-1",
          id_producto: "prod-2",
          cantidad_pedida: 2,
          precio_unitario: 10,
          cajas: null,
          presentacion: null,
          unidad_medida: "KGM",
          match_producto: {
            textoCliente: "Manzana verde",
            sugeridoMateo: {
              idProducto: "prod-granny",
              nombre: "MANZANA GRANNY SMITH",
              codigo: "115001010",
            },
            elegidoUsuario: {
              idProducto: "prod-2",
              nombre: "Pepino",
              codigo: "105",
            },
            fuente: "frase",
          },
          producto: {
            sku: "105",
            descripcion: "Pepino",
            metadatos_catalogo: null,
          },
        },
      ],
      productoRows: [
        {
          idProducto: "prod-2",
          codigo: "105",
          nombre: "Pepino",
          idBodega: "bod-1",
          kgDisponible: 100,
          unidadMedida: "KGM",
        },
      ],
      origenCorreoRows: [],
      idBodegaDetalle: "bod-1",
      notasLineas: "",
      hijas: [],
    });
    expect(lineas[0]?.propuestaSistema).toEqual({
      producto: {
        idProducto: "prod-granny",
        nombre: "MANZANA GRANNY SMITH",
        codigo: "115001010",
      },
      fuente: "frase",
    });
  });

  it("al reabrir una línea sin clave fuente no aprende el nombre del catálogo", () => {
    const lineas = mapDetalleLineasAForm({
      detalleLineas: [
        {
          id_linea_orden_venta: "l1",
          id_orden_venta: "ov-1",
          id_producto: "prod-1",
          cantidad_pedida: 2,
          precio_unitario: 10,
          cajas: null,
          presentacion: null,
          unidad_medida: "KGM",
          match_producto: {
            textoCliente: "Pepino",
            sugeridoMateo: null,
            elegidoUsuario: {
              idProducto: "prod-1",
              nombre: "Pepino",
              codigo: "105",
            },
          },
          producto: {
            sku: "105",
            descripcion: "Pepino",
            metadatos_catalogo: null,
          },
        },
      ],
      productoRows: [
        {
          idProducto: "prod-1",
          codigo: "105",
          nombre: "Pepino",
          idBodega: "bod-1",
          kgDisponible: 100,
          unidadMedida: "KGM",
        },
      ],
      origenCorreoRows: [],
      idBodegaDetalle: "bod-1",
      notasLineas: "",
      hijas: [],
    });
    expect(lineas[0]?.propuestaSistema).toEqual({
      producto: { idProducto: "prod-1", nombre: "Pepino", codigo: "105" },
      fuente: null,
    });
    expect(
      equivalenciasPorAprender({
        lineas,
        idComprador: "c1",
        idsProductoVenta: ["prod-1"],
      }),
    ).toEqual([]);
  });

  it("REQ-170: con una sola OT asigna otId a líneas que quedaron sin match", () => {
    const hija = createEmptyOrdenTrabajoHija({
      id: "ot-sola",
      almacen: "Cocina",
      numeroPedido: "000000000028590",
    });
    const lineas = mapDetalleLineasAForm({
      detalleLineas: [
        {
          id_linea_orden_venta: "l1",
          id_orden_venta: "ov-1",
          id_producto: "prod-1",
          cantidad_pedida: 1,
          precio_unitario: 5,
          cajas: null,
          presentacion: null,
          unidad_medida: "KGM",
          match_producto: null,
          producto: {
            sku: "999",
            descripcion: "Producto sin renglón OT",
            metadatos_catalogo: null,
          },
        },
      ],
      productoRows: [
        {
          idProducto: "prod-1",
          codigo: "999",
          nombre: "Producto sin renglón OT",
          idBodega: "bod-1",
          kgDisponible: 10,
          unidadMedida: "KGM",
        },
      ],
      origenCorreoRows: [],
      idBodegaDetalle: "bod-1",
      notasLineas: "",
      hijas: [hija],
    });
    expect(lineas[0]?.otId).toBe("ot-sola");
  });

  it("persiste y reindexa _idProducto verificado en origen", () => {
    const hija = createEmptyOrdenTrabajoHija({
      id: "manual:ot-1",
      almacen: "CANTINA",
    });
    const rows = buildOrigenCorreoFromOrdenesYLineas({
      hijas: [hija],
      lineas: [
        {
          otId: "manual:ot-1",
          idProducto: "prod-1",
          nombre: "Pepino",
          codigo: "105",
          cantidad: 2,
          unidadMedida: "KGM",
          precioUnitario: 10,
          aliasCliente: "pepino del correo",
        },
      ],
    });
    expect(rows[0]?._idProducto).toBe("prod-1");
    const index = indexIdProductoVerificadoOrigen(rows);
    expect(index.get("manual:ot-1#0")).toBe("prod-1");
  });
});
