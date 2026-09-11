const COLUMN_MIN_WIDTH: Record<string, string> = {
  venta: "min-w-[9rem]",
  comprador: "min-w-[7.5rem] max-w-[9.5rem]",
  productos: "min-w-[8rem]",
  cantidadKg: "min-w-[9rem]",
  total: "min-w-[6.5rem]",
  estado: "min-w-[8rem]",
  fecha: "min-w-[10rem]",
  origen: "min-w-[7rem]",
  imprimir: "min-w-[6.5rem]",
  descargar: "min-w-[6.5rem]",
  pdfActualizado: "min-w-[7.5rem]",
  acciones: "min-w-[15rem]",
};

export const ORDENES_VENTA_TABLE_MIN_WIDTH_CLASS = "w-full";

export function ordenVentaTableColumnClass(
  columnId: string,
  variant: "header" | "cell" = "cell",
): string {
  const width = COLUMN_MIN_WIDTH[columnId] ?? "min-w-[8rem]";
  const nowrap = `${width} whitespace-nowrap`;

  if (columnId === "comprador") {
    return `${width} truncate`;
  }

  if (variant === "cell" && columnId === "total") {
    return `${nowrap} font-medium text-polaria-teal`;
  }

  return nowrap;
}
