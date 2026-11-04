import { describe, expect, it } from "vitest";
import {
  mapDetalleLineasAForm,
  ovTieneLineasMaterializadas,
} from "./map-detalle-lineas-a-form";
import { createEmptyOrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import { buildOrigenCorreoFromOrdenesYLineas } from "../origen/origen-correo-build-from-form";
import { indexIdProductoVerificadoOrigen } from "../origen/origen-correo-id-producto-verificado";

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
