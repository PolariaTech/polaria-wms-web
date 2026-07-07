const TRUNCATE_COLUMN_MAX = "max-w-[24rem]";

const ORDEN_COMPRA_COLUMN_MIN_WIDTH: Record<string, string> = {
  orden: "min-w-[10rem]",
  cuenta: "min-w-[9rem]",
  proveedor: "min-w-[12rem]",
  estado: "min-w-[9rem]",
  fechaOc: "min-w-[8rem]",
  llegada: "min-w-[8rem]",
  destino: "min-w-[10rem]",
  productos: "min-w-[16rem]",
};

const ORDEN_VENTA_COLUMN_MIN_WIDTH: Record<string, string> = {
  orden: "min-w-[10rem]",
  cuenta: "min-w-[9rem]",
  comprador: "min-w-[12rem]",
  estado: "min-w-[9rem]",
  fecha: "min-w-[9rem]",
  destino: "min-w-[10rem]",
  productos: "min-w-[16rem]",
};

export const CUSTODIO_ORDEN_COMPRA_TABLE_MIN_WIDTH_CLASS = "min-w-[88rem]";
export const CUSTODIO_ORDEN_VENTA_TABLE_MIN_WIDTH_CLASS = "min-w-[72rem]";

function withTruncate(minWidthClass: string, tone = ""): string {
  return `${minWidthClass} ${TRUNCATE_COLUMN_MAX} truncate whitespace-nowrap${tone}`;
}

export function custodioOrdenCompraColumnClass(columnId: string): string {
  const width = ORDEN_COMPRA_COLUMN_MIN_WIDTH[columnId] ?? "min-w-[9rem]";

  if (columnId === "proveedor" || columnId === "productos" || columnId === "destino") {
    return withTruncate(width, columnId === "productos" ? "" : " text-polaria-w-50");
  }

  if (columnId === "fechaOc" || columnId === "llegada" || columnId === "cuenta") {
    return `${width} whitespace-nowrap text-polaria-w-50`;
  }

  return width;
}

export function custodioOrdenVentaColumnClass(columnId: string): string {
  const width = ORDEN_VENTA_COLUMN_MIN_WIDTH[columnId] ?? "min-w-[9rem]";

  if (columnId === "comprador" || columnId === "productos" || columnId === "destino") {
    return withTruncate(width, columnId === "comprador" ? "" : " text-polaria-w-50");
  }

  if (columnId === "fecha" || columnId === "cuenta") {
    return `${width} whitespace-nowrap text-polaria-w-50`;
  }

  return width;
}
