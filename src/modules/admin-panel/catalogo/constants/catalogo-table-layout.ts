/** Anchos mínimos de columnas del catálogo (tabla horizontal ancha). */
export const CATALOGO_TABLE_COLUMN_MIN_WIDTH: Record<string, string> = {
  codigo: "min-w-[8rem]",
  titulo: "min-w-[12rem]",
  slug: "min-w-[11rem]",
  descripcion: "min-w-[15rem]",
  proveedor: "min-w-[10rem]",
  categoria: "min-w-[10rem]",
  tipo: "min-w-[8rem]",
  etiquetas: "min-w-[10rem]",
  publicado: "min-w-[8rem]",
  estado: "min-w-[8rem]",
  sku: "min-w-[9rem]",
  "codigo-barras": "min-w-[10rem]",
  "nombre-op-1": "min-w-[10rem]",
  "valor-op-1": "min-w-[10rem]",
  vinculado: "min-w-[11rem]",
  precio: "min-w-[8rem]",
  impuesto: "min-w-[8rem]",
  tracker: "min-w-[10rem]",
  acciones: "min-w-[14rem]",
};

export const CATALOGO_TABLE_MIN_WIDTH_CLASS = "min-w-[116rem]";

export function catalogoTableColumnClass(columnId: string): string {
  const width = CATALOGO_TABLE_COLUMN_MIN_WIDTH[columnId] ?? "min-w-[9rem]";
  if (columnId === "acciones") {
    return `${width} whitespace-nowrap`;
  }

  return `${width} max-w-[22rem] truncate`;
}

export function applyCatalogoColumnWidths<
  T extends {
    id: string;
    headerClassName?: string;
    cellClassName?: string;
  },
>(columns: readonly T[]): T[] {
  return columns.map((column) => ({
    ...column,
    headerClassName: catalogoTableColumnClass(column.id),
    cellClassName: catalogoTableColumnClass(column.id),
  }));
}
