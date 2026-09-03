const COLUMN_MIN_WIDTH: Record<string, string> = {
  bodega: "min-w-[16rem]",
  tipo: "min-w-[12rem]",
  fecha: "min-w-[12rem]",
  estado: "min-w-[8.5rem]",
};

export const INTEGRACION_TABLE_MIN_WIDTH_CLASS = "min-w-[52rem]";

export function integracionTableColumnClass(columnId: string): string {
  const width = COLUMN_MIN_WIDTH[columnId] ?? "min-w-[8rem]";
  return `${width} whitespace-nowrap`;
}
