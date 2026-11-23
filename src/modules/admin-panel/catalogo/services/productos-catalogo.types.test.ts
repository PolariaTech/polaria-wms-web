import { describe, expect, it } from "vitest";
import type {
  CatalogoImportResult,
  CatalogoProductoListRow,
} from "./productos-catalogo.types";

describe("productos-catalogo.types", () => {
  it("permite construir un resultado de importación", () => {
    const result: CatalogoImportResult = { imported: 1, skipped: 0, errors: [] };
    const row: Pick<CatalogoProductoListRow, "idProducto"> = { idProducto: "p" };
    expect(result.imported).toBe(1);
    expect(row.idProducto).toBe("p");
  });
});
