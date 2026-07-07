const SOLICITUDES_COLUMN_MIN_WIDTH: Record<string, string> = {
  codigo: "min-w-[11rem]",
  productos: "min-w-[18rem]",
  peso: "min-w-[10rem]",
};

const ORDENES_COLUMN_MIN_WIDTH: Record<string, string> = {
  orden: "min-w-[11rem]",
  proveedor: "min-w-[13rem]",
  productos: "min-w-[18rem]",
  estado: "min-w-[9rem]",
  fecha: "min-w-[8rem]",
  observacion: "min-w-[12rem]",
};

const TRUNCATE_COLUMN_MAX = "max-w-[24rem]";

export const SOLICITUDES_TABLE_MIN_WIDTH_CLASS = "min-w-[44rem]";
export const ORDENES_TABLE_MIN_WIDTH_CLASS = "min-w-[72rem]";

function withTruncate(minWidthClass: string): string {
  return `${minWidthClass} ${TRUNCATE_COLUMN_MAX} truncate whitespace-nowrap`;
}

export function solicitudTableColumnClass(columnId: string): string {
  const width = SOLICITUDES_COLUMN_MIN_WIDTH[columnId] ?? "min-w-[9rem]";

  if (columnId === "productos" || columnId === "peso") {
    return withTruncate(width);
  }

  return width;
}

export function ordenTableColumnClass(columnId: string): string {
  const width = ORDENES_COLUMN_MIN_WIDTH[columnId] ?? "min-w-[9rem]";

  if (
    columnId === "proveedor" ||
    columnId === "productos" ||
    columnId === "observacion"
  ) {
    const tone =
      columnId === "observacion" ? " text-polaria-w-50" : "";
    return `${withTruncate(width)}${tone}`;
  }

  if (columnId === "fecha") {
    return `${width} whitespace-nowrap text-polaria-w-50`;
  }

  return width;
}
