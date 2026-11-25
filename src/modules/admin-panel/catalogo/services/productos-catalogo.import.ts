import { requireCodigoCuenta } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  CATALOGO_UNIDAD_MEDIDA_DEFAULT,
} from "../constants/catalogo-producto";
import type { CatalogoExcelImportRow } from "../utils/catalogo-excel-import";
import { parseCatalogoSpreadsheetFile } from "../utils/catalogo-excel-import";
import {
  createCatalogoProductoPrimario,
  createCatalogoProductoSecundario,
} from "./productos-catalogo.mutations";
import { listProductosPrimariosCatalogo } from "./productos-catalogo.primarios";
import type { CatalogoImportResult } from "./productos-catalogo.types";

async function createImportRow(
  codigoCuenta: string,
  row: CatalogoExcelImportRow,
  primariosBySku: Map<string, string>,
): Promise<void> {
  const unidadMedida = row.unidadMedida.trim() || CATALOGO_UNIDAD_MEDIDA_DEFAULT;

  if (row.tipo === "primario") {
    await createCatalogoProductoPrimario({
      codigoCuenta,
      sku: row.sku,
      titulo: row.titulo,
      unidadMedida,
      unidadVisualizacion: row.unidadVisualizacion,
      metadatos: row.metadatos,
    });
    return;
  }

  const idProductoPrimario = primariosBySku.get(row.skuPrimario ?? "");
  if (!idProductoPrimario) {
    throw new DomainServiceError(
      `No se encontró primario con SKU "${row.skuPrimario}" para "${row.sku}".`,
      "INVALID_ARGUMENT",
    );
  }

  await createCatalogoProductoSecundario({
    codigoCuenta,
    sku: row.sku,
    titulo: row.titulo,
    unidadMedida,
    unidadVisualizacion: row.unidadVisualizacion,
    idProductoPrimario,
    esPrimario: false,
    esSecundario: true,
    metadatos: row.metadatos,
  });
}

/** Importa productos desde Excel/CSV (primarios y luego secundarios). */
export async function importCatalogoProductosFromFile(
  codigoCuenta: string,
  file: File,
): Promise<CatalogoImportResult> {
  const cuenta = requireCodigoCuenta(codigoCuenta);
  const { rows, errors: parseErrors, skipped } =
    await parseCatalogoSpreadsheetFile(file);

  if (!rows.length) {
    return { imported: 0, errors: parseErrors, skipped };
  }

  const primarios = rows.filter((row) => row.tipo === "primario");
  const secundarios = rows.filter((row) => row.tipo === "secundario");
  const primariosBySku = new Map<string, string>();
  const errors = [...parseErrors];
  let imported = 0;

  for (const row of primarios) {
    try {
      const created = await createCatalogoProductoPrimario({
        codigoCuenta: cuenta,
        sku: row.sku,
        titulo: row.titulo,
        unidadMedida: row.unidadMedida.trim() || CATALOGO_UNIDAD_MEDIDA_DEFAULT,
        unidadVisualizacion: row.unidadVisualizacion,
        metadatos: row.metadatos,
      });
      primariosBySku.set(row.sku, created.idProducto);
      imported += 1;
    } catch (err: unknown) {
      errors.push(
        `SKU ${row.sku}: ${
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo importar el producto."
        }`,
      );
    }
  }

  const existingPrimarios = await listProductosPrimariosCatalogo(cuenta);
  for (const option of existingPrimarios) {
    const skuMatch = /\(([^)]+)\)\s*$/.exec(option.label);
    const sku = skuMatch?.[1]?.trim();
    if (sku && !primariosBySku.has(sku)) {
      primariosBySku.set(sku, option.idProducto);
    }
  }

  for (const row of secundarios) {
    try {
      await createImportRow(cuenta, row, primariosBySku);
      imported += 1;
    } catch (err: unknown) {
      errors.push(
        `SKU ${row.sku}: ${
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo importar el producto."
        }`,
      );
    }
  }

  return { imported, errors, skipped };
}