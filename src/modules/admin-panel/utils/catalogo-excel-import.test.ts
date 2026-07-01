import { describe, expect, it } from "vitest";
import { parseCatalogoSpreadsheetFile } from "./catalogo-excel-import";

function csvFile(content: string, name = "catalogo.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

describe("catalogo-excel-import", () => {
  it("parsea filas con headers estilo frio (inglés)", async () => {
    const file = csvFile(
      [
        "title,description,provider,category,productType,status,precio,sku",
        "Salmon entero,Salmon fresco,Mar Azul,Pescado,Primario,draft,12000,SKU-001",
      ].join("\n"),
    );

    const result = await parseCatalogoSpreadsheetFile(file);

    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      sku: "SKU-001",
      titulo: "Salmon entero",
      tipo: "primario",
      metadatos: {
        proveedor: "Mar Azul",
        categoria: "Pescado",
        precio: "12000",
        estado: "draft",
      },
    });
  });

  it("omite filas sin campos obligatorios", async () => {
    const file = csvFile(
      [
        "title,description,provider,category,productType,status,precio",
        "Solo titulo,,Mar Azul,Pescado,Primario,draft,100",
      ].join("\n"),
    );

    const result = await parseCatalogoSpreadsheetFile(file);

    expect(result.rows).toEqual([]);
    expect(result.skipped).toBe(1);
    expect(result.errors[0]).toContain("description");
  });

  it("genera SKU si falta en fila primaria válida", async () => {
    const file = csvFile(
      [
        "title,description,provider,category,productType,status,precio",
        "Filete premium,Desc,Proveedor A,Categoria A,Primario,active,8000",
      ].join("\n"),
    );

    const result = await parseCatalogoSpreadsheetFile(file);

    expect(result.errors).toEqual([]);
    expect(result.rows[0]?.sku).toBeTruthy();
    expect(result.rows[0]?.titulo).toBe("Filete premium");
  });

  it("exige vinculado para secundario sin SKU primario", async () => {
    const file = csvFile(
      [
        "title,description,provider,category,productType,status,precio",
        "Filete premium,Desc,Proveedor A,Categoria A,Secundario,active,8000",
      ].join("\n"),
    );

    const result = await parseCatalogoSpreadsheetFile(file);

    expect(result.rows).toEqual([]);
    expect(result.errors[0]).toContain("Vinculado");
  });
});
