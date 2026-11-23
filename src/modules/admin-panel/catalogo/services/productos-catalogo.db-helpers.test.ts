import { describe, expect, it } from "vitest";
import {
  buildProductoInsertPayload,
  mapProductoRow,
  PRODUCTO_LIST_COLUMNS,
  queryProductosCatalogo,
} from "./productos-catalogo.db-helpers";
import type { ProductoDbRow } from "./productos-catalogo.types";

describe("productos-catalogo.db-helpers", () => {
  it("buildProductoInsertPayload arma el insert con valores por defecto null", () => {
    const payload = buildProductoInsertPayload(
      {
        codigoCuenta: "MIT00",
        sku: "SKU1",
        titulo: "Demo",
        unidadMedida: "kg",
        unidadVisualizacion: "cantidad",
        esPrimario: true,
        esSecundario: false,
        metadatos: {},
      } as never,
      "MIT00",
      "SKU1",
      "Demo",
      "COD1",
    );

    expect(payload).toMatchObject({
      codigo_cuenta: "MIT00",
      sku: "SKU1",
      descripcion: "Demo",
      codigo_almacen: "COD1",
      es_primario: true,
      es_secundario: false,
      id_producto_primario: null,
      merma_pct: null,
      esta_activo: true,
    });
  });

  it("mapProductoRow usa metadatos y valores de respaldo", () => {
    const row = {
      id_producto: "p1",
      sku: "SKU1",
      descripcion: "Descripción",
      codigo_almacen: null,
      es_primario: true,
      es_secundario: false,
      unidad_medida: null,
      esta_activo: false,
      metadatos_catalogo: { titulo: "Título meta" },
    } as unknown as ProductoDbRow;

    const mapped = mapProductoRow(row, 2);

    expect(mapped.idNum).toBe(3);
    expect(mapped.titulo).toBe("Título meta");
    expect(mapped.codigo).toBe("SKU1");
    expect(mapped.unidad).toBe("—");
    expect(mapped.estaActivo).toBe(false);
    expect(mapped.stock).toBe("0");
  });

  it("queryProductosCatalogo consulta primero con metadatos_catalogo", async () => {
    const calls: string[] = [];
    const rows = await queryProductosCatalogo(async (columns) => {
      calls.push(columns);
      return [{ ok: true }];
    });

    expect(rows).toEqual([{ ok: true }]);
    expect(calls).toEqual([`${PRODUCTO_LIST_COLUMNS},metadatos_catalogo`]);
  });
});
