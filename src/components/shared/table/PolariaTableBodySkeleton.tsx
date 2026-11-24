import { POLARIA_TABLE_ROW_HEIGHT_CLASS } from "@/components/shared/table/polaria-table-layout";
import { cn } from "@/lib/utils/cn";

/** Filas placeholder dentro del `<tbody>` mientras carga el listado. */
export function PolariaTableBodySkeleton({
  columnCount,
  rowCount,
}: {
  columnCount: number;
  rowCount: number;
}) {
  const rows = Math.max(1, rowCount);
  const cols = Math.max(1, columnCount);

  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr
          key={`skel-row-${rowIndex}`}
          className={cn(
            POLARIA_TABLE_ROW_HEIGHT_CLASS,
            "border-t border-polaria-w-08",
          )}
          aria-hidden={rowIndex > 0}
        >
          {Array.from({ length: cols }, (_, colIndex) => (
            <td
              key={`skel-cell-${rowIndex}-${colIndex}`}
              className="px-5 py-0 sm:px-6"
            >
              <div
                className={cn(
                  "h-3 animate-pulse rounded bg-polaria-w-08",
                  colIndex === 0 ? "w-24" : colIndex === cols - 1 ? "w-12" : "w-32",
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
