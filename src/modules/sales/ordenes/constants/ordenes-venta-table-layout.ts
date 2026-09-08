const COLUMN_MIN_WIDTH: Record<string, string> = {
  venta: "min-w-[13rem]",
  comprador: "min-w-[14rem]",
  productos: "min-w-[8rem]",
  cantidadKg: "min-w-[9rem]",
  total: "min-w-[7rem]",
  estado: "min-w-[8.5rem]",
  fecha: "min-w-[12rem]",
  origen: "min-w-[7rem]",
  imprimir: "min-w-[7.5rem]",
  descargar: "min-w-[7.5rem]",
  pdfActualizado: "min-w-[8.5rem]",
};

export const ORDENES_VENTA_TABLE_MIN_WIDTH_CLASS = "min-w-[104rem]";

export function ordenVentaTableColumnClass(
  columnId: string,
  variant: "header" | "cell" = "cell",
): string {
  const width = COLUMN_MIN_WIDTH[columnId] ?? "min-w-[8rem]";
  const nowrap = `${width} whitespace-nowrap`;

  if (variant === "cell" && columnId === "total") {
    return `${nowrap} font-medium text-polaria-teal`;
  }

  return nowrap;
}
