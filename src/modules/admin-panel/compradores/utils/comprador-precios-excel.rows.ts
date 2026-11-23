import { aliasPrincipalPorPar } from "./comprador-alias-reglas";
import {
  COMPRADOR_PRECIOS_DEFAULT_PRECIO,
  COMPRADOR_PRECIOS_EXCEL_COLUMNS,
  EMPTY_TEMPLATE_ROW,
  TEMPLATE_BLANK_ROWS,
  COLUMN_WIDTH_LIMITS,
  type CompradorPreciosExcelSourceRow,
  type CompradorPreciosExcelVariant,
  type CompradorPreciosExportFilters,
  type CompradorPreciosTemplateAlias,
  type CompradorPreciosTemplateComprador,
  type CompradorPreciosTemplateProducto,
} from "./comprador-precios-excel.constants";

function normalizeGrupo(value: string): string {
  return value.trim();
}

/** Precio a mostrar/exportar: usa el actual o 50 si no hay. */
export function resolveCompradorPrecioExcel(
  precioActual: number | null | undefined,
): number {
  if (precioActual == null || !Number.isFinite(precioActual)) {
    return COMPRADOR_PRECIOS_DEFAULT_PRECIO;
  }
  return precioActual;
}

/** Precio vigente efectivo (override importado o lista). */
export function resolveCompradorPrecioVigente(row: {
  precioActual: number | null;
  precioNuevo: number | null;
}): number {
  if (row.precioNuevo != null && Number.isFinite(row.precioNuevo)) {
    return row.precioNuevo;
  }
  return resolveCompradorPrecioExcel(row.precioActual);
}

export function resolveCompradorPrecioNuevoPrint(
  precioNuevo: number | null | undefined,
): number {
  if (precioNuevo == null || !Number.isFinite(precioNuevo)) {
    return COMPRADOR_PRECIOS_DEFAULT_PRECIO;
  }
  return precioNuevo;
}

export function pricesForVariant(
  row: CompradorPreciosExcelSourceRow,
  variant: CompradorPreciosExcelVariant,
): { actual: number; nuevo: number } {
  if (variant === "print") {
    return {
      actual: resolveCompradorPrecioExcel(row.precioActual),
      nuevo: resolveCompradorPrecioNuevoPrint(row.precioNuevo),
    };
  }

  const vigente = resolveCompradorPrecioVigente(row);
  return { actual: vigente, nuevo: vigente };
}

/** Matriz comprador × producto. */
export function buildCompradorPreciosTemplateRows(input: {
  compradores: readonly CompradorPreciosTemplateComprador[];
  productos: readonly CompradorPreciosTemplateProducto[];
  aliases: readonly CompradorPreciosTemplateAlias[];
  precioListaByProductoId: Record<string, number | null | undefined>;
  filters?: CompradorPreciosExportFilters;
}): CompradorPreciosExcelSourceRow[] {
  const aliasByPair = aliasPrincipalPorPar(input.aliases);

  const grupoFilter = input.filters?.grupos
    ?.map(normalizeGrupo)
    .filter(Boolean);
  const grupoSet =
    grupoFilter && grupoFilter.length > 0
      ? new Set(grupoFilter.map((value) => value.toLowerCase()))
      : null;

  const productoFilter = input.filters?.idProductos?.filter(Boolean);
  const productoSet =
    productoFilter && productoFilter.length > 0
      ? new Set(productoFilter)
      : null;

  const codigosExtra = [
    ...(input.filters?.codigosComprador ?? []),
    ...(input.filters?.codigoComprador
      ? [input.filters.codigoComprador]
      : []),
  ]
    .map((value) => value.trim())
    .filter(Boolean);
  const codigoSet =
    codigosExtra.length > 0
      ? new Set(codigosExtra.map((value) => value.toLowerCase()))
      : null;

  const compradores = [...input.compradores]
    .filter((row) => {
      const grupo = normalizeGrupo(row.grupo);
      const inGrupo = Boolean(
        grupoSet && grupo && grupoSet.has(grupo.toLowerCase()),
      );
      const inExtra = Boolean(
        codigoSet && codigoSet.has(row.codigo.trim().toLowerCase()),
      );

      if (grupoSet && codigoSet) return inGrupo || inExtra;
      if (grupoSet) return inGrupo;
      if (codigoSet) return inExtra;
      return true;
    })
    .sort((left, right) => left.nombre.localeCompare(right.nombre, "es"));

  const productos = [...input.productos]
    .filter((row) => (productoSet ? productoSet.has(row.idProducto) : true))
    .sort((left, right) => left.codigo.localeCompare(right.codigo, "es"));

  const rows: CompradorPreciosExcelSourceRow[] = [];

  for (const comprador of compradores) {
    for (const producto of productos) {
      const alias = aliasByPair.get(
        `${comprador.idComprador}::${producto.idProducto}`,
      );
      const precioLista = input.precioListaByProductoId[producto.idProducto];

      rows.push({
        grupo: normalizeGrupo(comprador.grupo),
        codigoComprador: comprador.codigo,
        nombreComprador: comprador.nombre,
        codigoProducto: producto.codigo,
        nombreProducto: producto.nombre,
        equivalencia: alias?.equivalencia ?? "",
        precioActual:
          precioLista !== undefined && precioLista !== null
            ? precioLista
            : null,
        precioNuevo: alias?.precioOverride ?? null,
      });
    }
  }

  return rows;
}

/**
 * Colapsa a una fila por (grupo × producto).
 * Conservado por si hace falta un resumen; el Excel de gestión no lo usa.
 */
export function collapseCompradorPreciosRowsByGrupo(
  rows: readonly CompradorPreciosExcelSourceRow[],
): CompradorPreciosExcelSourceRow[] {
  const byKey = new Map<string, CompradorPreciosExcelSourceRow>();

  const sorted = [...rows].sort((left, right) => {
    const byGrupo = left.grupo.localeCompare(right.grupo, "es");
    if (byGrupo !== 0) return byGrupo;
    const byProducto = left.codigoProducto.localeCompare(
      right.codigoProducto,
      "es",
    );
    if (byProducto !== 0) return byProducto;
    return left.nombreComprador.localeCompare(right.nombreComprador, "es");
  });

  for (const row of sorted) {
    const grupo = normalizeGrupo(row.grupo);
    const codigoProducto = row.codigoProducto.trim();
    if (!grupo || !codigoProducto) continue;

    const key = `${grupo.toLowerCase()}::${codigoProducto.toLowerCase()}`;
    if (byKey.has(key)) continue;
    byKey.set(key, { ...row, grupo });
  }

  return [...byKey.values()];
}

export function templateDataRows(
  rows: readonly CompradorPreciosExcelSourceRow[],
): CompradorPreciosExcelSourceRow[] {
  if (rows.length > 0) return [...rows];

  return Array.from({ length: TEMPLATE_BLANK_ROWS }, () => EMPTY_TEMPLATE_ROW);
}

export function buildCompradorPreciosExcelAoA(
  rows: readonly CompradorPreciosExcelSourceRow[],
  variant: CompradorPreciosExcelVariant = "template",
): (string | number)[][] {
  return [
    [...COMPRADOR_PRECIOS_EXCEL_COLUMNS],
    ...templateDataRows(rows).map((row) => {
      const prices = pricesForVariant(row, variant);
      return [
        row.grupo || "",
        row.codigoComprador || "",
        row.nombreComprador || "",
        row.codigoProducto || "",
        row.nombreProducto || "",
        row.equivalencia || "",
        prices.actual,
        prices.nuevo,
      ];
    }),
  ];
}

export function fitExcelColumnWidth(
  values: readonly string[],
  min: number,
  max: number,
): number {
  const longest = values.reduce(
    (current, value) => Math.max(current, value.trim().length),
    0,
  );

  return Math.min(max, Math.max(min, longest + 3));
}

export function buildCompradorPreciosColumnWidths(
  rows: readonly CompradorPreciosExcelSourceRow[],
): { width: number }[] {
  const dataRows = templateDataRows(rows);

  const columns = [
    dataRows.map((row) => row.grupo),
    dataRows.map((row) => row.codigoComprador),
    dataRows.map((row) => row.nombreComprador),
    dataRows.map((row) => row.codigoProducto),
    dataRows.map((row) => row.nombreProducto),
    dataRows.map((row) => row.equivalencia),
    ["Precio actual"],
    ["Precio nuevo"],
  ];

  return COLUMN_WIDTH_LIMITS.map((limits, index) => ({
    width: fitExcelColumnWidth(
      [COMPRADOR_PRECIOS_EXCEL_COLUMNS[index], ...columns[index]],
      limits.min,
      limits.max,
    ),
  }));
}

