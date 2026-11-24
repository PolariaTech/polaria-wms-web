/**
 * Anchos en % (suman 100) con `table-fixed`: la tabla usa todo el card,
 * mantiene el padding normal de PolariaDataTable y Acciones no se corta.
 * Solo OCC / Cliente / Fecha truncan; el resto respira.
 */
const COLUMN_WIDTH: Record<string, string> = {
  venta: "w-[20%]",
  occ: "w-[15%]",
  comprador: "w-[17%]",
  productos: "w-[12%]",
  cantidadKg: "w-[10%]",
  total: "w-[8%]",
  estado: "w-[12%]",
  fecha: "w-[18%]",
  ot: "w-[8%]",
  origen: "w-[10%]",
  imprimir: "w-[8%]",
  descargar: "w-[8%]",
  pdfActualizado: "w-[9%]",
  acciones: "w-[10%]",
};

/** Ancho completo + layout fijo. Sin tocar el padding de celdas. */
export const ORDENES_VENTA_TABLE_MIN_WIDTH_CLASS = "w-full table-fixed";

export function ordenVentaTableColumnClass(
  columnId: string,
  variant: "header" | "cell" = "cell",
): string {
  const width = COLUMN_WIDTH[columnId] ?? "w-[10%]";
  const nowrap = `${width} whitespace-nowrap`;

  if (columnId === "venta") {
    return `${width} whitespace-nowrap`;
  }

  if (columnId === "comprador") {
    return `${width} overflow-hidden truncate`;
  }

  if (columnId === "occ") {
    return variant === "header"
      ? `${width} overflow-hidden whitespace-nowrap truncate`
      : `${width} overflow-hidden`;
  }

  if (columnId === "fecha") {
    return `${width} overflow-hidden whitespace-nowrap truncate`;
  }

  if (columnId === "acciones") {
    return nowrap;
  }

  if (variant === "cell" && (columnId === "total" || columnId === "ot")) {
    return `${nowrap} font-medium text-polaria-teal`;
  }

  return nowrap;
}
