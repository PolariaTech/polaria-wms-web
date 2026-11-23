import { requireCodigoCuenta } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { listCatalogoProductosAdmin } from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import {
  parseCompradorPreciosExcelFile,
  planCompradorPreciosImport,
} from "../utils/comprador-precios-import";
import { listCompradoresAdmin } from "./compradores.service";
import { queryAliasCuentaRows } from "./comprador-producto-alias.service.list";
import {
  createCompradorProductoAliasAdmin,
  updateCompradorProductoAliasAdmin,
} from "./comprador-producto-alias.service.mutations";
import {
  CATALOGO_TEMPLATE_LIMIT,
  parsePrecioOverride,
} from "./comprador-producto-alias.service.types";

export interface CompradorPreciosImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/** Aplica equivalencia y precio nuevo de la plantilla Excel. */
export async function importCompradorPreciosFromFile(
  codigoCuenta: string,
  file: File,
): Promise<CompradorPreciosImportResult> {
  const cuenta = requireCodigoCuenta(codigoCuenta);
  const parsed = await parseCompradorPreciosExcelFile(file);

  const [compradores, productos, aliasRows] = await Promise.all([
    listCompradoresAdmin({
      codigoCuenta: cuenta,
      soloActivos: false,
      limit: CATALOGO_TEMPLATE_LIMIT,
    }),
    listCatalogoProductosAdmin({
      codigoCuenta: cuenta,
      soloActivos: false,
      limit: CATALOGO_TEMPLATE_LIMIT,
    }),
    queryAliasCuentaRows(cuenta),
  ]);

  const plan = planCompradorPreciosImport({
    rows: parsed.rows,
    parseErrors: parsed.errors,
    parseSkipped: parsed.skipped,
    compradores: compradores.map((row) => ({
      idComprador: row.idComprador,
      codigo: row.codigo,
      grupo: row.grupo,
    })),
    productos: productos.map((row) => ({
      idProducto: row.idProducto,
      codigo: row.codigo,
      nombre: row.titulo,
    })),
    aliases: aliasRows.map((row) => ({
      idAlias: row.id_alias,
      idComprador: row.id_comprador,
      idProducto: row.id_producto,
      alias: row.alias,
      precioOverride: parsePrecioOverride(row.precio),
    })),
  });

  const errors = [...plan.errors];
  let imported = 0;

  for (const create of plan.creates) {
    try {
      await createCompradorProductoAliasAdmin({
        codigoCuenta: cuenta,
        idComprador: create.idComprador,
        idProducto: create.idProducto,
        alias: create.alias,
        precio: create.precio,
        codigoProducto: productos.find((producto) => producto.idProducto === create.idProducto)?.codigo,
      });
      imported += 1;
    } catch (error: unknown) {
      errors.push(
        `Fila ${create.rowNumber}: ${
          error instanceof DomainServiceError
            ? error.message
            : "No se pudo crear la equivalencia."
        }`,
      );
    }
  }

  for (const update of plan.updates) {
    try {
      await updateCompradorProductoAliasAdmin({
        codigoCuenta: cuenta,
        idAlias: update.idAlias,
        alias: update.alias,
        precio: update.precio,
      });
      imported += 1;
    } catch (error: unknown) {
      errors.push(
        `Fila ${update.rowNumber}: ${
          error instanceof DomainServiceError
            ? error.message
            : "No se pudo actualizar la equivalencia."
        }`,
      );
    }
  }

  return {
    imported,
    skipped: plan.skipped,
    errors,
  };
}
