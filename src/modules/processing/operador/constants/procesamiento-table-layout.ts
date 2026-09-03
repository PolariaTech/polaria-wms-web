const COLUMN_MIN_WIDTH: Record<string, string> = {
  orden: "min-w-[12rem]",
  primario: "min-w-[16rem]",
  secundario: "min-w-[16rem]",
  insumo: "min-w-[10rem]",
  estimado: "min-w-[8rem]",
  estado: "min-w-[8.5rem]",
  fecha: "min-w-[12rem]",
};

export const PROCESAMIENTO_TABLE_MIN_WIDTH_CLASS = "min-w-[84rem]";

export function procesamientoTableColumnClass(columnId: string): string {
  const width = COLUMN_MIN_WIDTH[columnId] ?? "min-w-[8rem]";
  return `${width} whitespace-nowrap`;
}
