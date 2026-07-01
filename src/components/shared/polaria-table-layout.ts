import { cn } from "@/lib/cn";

/** Altura fija por fila para que la tabla no salte al paginar. */
export const POLARIA_TABLE_ROW_HEIGHT_CLASS = "h-[3.25rem]";

export const POLARIA_TABLE_SCROLL_CLASS = "polaria-scrollbar overflow-x-auto";

export function getPaginationPlaceholderCount(
  visibleRowCount: number,
  pageSize: number,
  paginationEnabled: boolean,
): number {
  if (!paginationEnabled || visibleRowCount === 0) {
    return 0;
  }

  return Math.max(0, pageSize - visibleRowCount);
}

export function getTableBodyMinHeightStyle(pageSize: number): { minHeight: string } {
  return { minHeight: `${pageSize * 3.25}rem` };
}

export function mergeTableColumnClass(
  ...classes: Array<string | undefined>
): string {
  return cn(classes);
}
