"use client";

import { cn } from "@/lib/utils/cn";
import { formatPrecioEs } from "@/lib/utils/decimal-es";
import type { CompradorProductoAliasListRow } from "../services/comprador-producto-alias.service";

const HEAD =
  "sticky top-0 z-[1] border-b border-polaria-t-20 bg-polaria-t-08 px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50";
const CELL =
  "border-b border-polaria-w-08 border-r border-polaria-w-08 px-0 py-0 polaria-text-body-sm last:border-r-0";
const CELL_PAD = "px-3 py-2.5";

export interface CompradorEquivalenciaDraft {
  alias: string;
  /** Texto editable del precio; vacío = sin precio. */
  precioTexto: string;
}

interface CompradorEquivalenciasTableProps {
  rows: CompradorProductoAliasListRow[];
  emptyMessage?: string;
  /** Modo Excel: solo Equivalencia y Precio editables. */
  editable?: boolean;
  drafts?: Record<string, CompradorEquivalenciaDraft>;
  disabled?: boolean;
  onDraftChange?: (
    idAlias: string,
    patch: Partial<CompradorEquivalenciaDraft>,
  ) => void;
}

function precioToTexto(precio: number | null): string {
  if (precio == null) return "";
  return String(precio);
}

export function CompradorEquivalenciasTable({
  rows,
  emptyMessage = "Este comprador no tiene equivalencias registradas.",
  editable = false,
  drafts,
  disabled = false,
  onDraftChange,
}: CompradorEquivalenciasTableProps) {
  if (rows.length === 0) {
    return (
      <p className="polaria-text-body-sm text-polaria-w-50">{emptyMessage}</p>
    );
  }

  return (
    <div className="max-h-[min(48dvh,22rem)] overflow-auto rounded-xl border border-polaria-t-20">
      <table className="w-full min-w-[48rem] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[7.5rem]" />
          <col />
          <col className="w-[12rem]" />
          <col className="w-[8rem]" />
          <col className="w-[9rem]" />
        </colgroup>
        <thead>
          <tr>
            <th className={HEAD}>Código</th>
            <th className={HEAD}>Nombre</th>
            <th className={HEAD}>Equivalencia</th>
            <th className={`${HEAD} text-right`}>Precio comprador</th>
            <th className={HEAD}>Unidad</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const draft = drafts?.[row.idAlias];
            const aliasValue = draft?.alias ?? row.alias;
            const precioTexto =
              draft?.precioTexto ?? precioToTexto(row.precio);

            return (
              <tr key={row.idAlias} className="text-polaria-w">
                <td
                  className={cn(
                    CELL,
                    CELL_PAD,
                    "font-medium text-polaria-teal",
                  )}
                >
                  {row.codigoProducto}
                </td>
                <td className={cn(CELL, CELL_PAD, "break-words")}>
                  {row.nombreProducto}
                </td>
                <td className={CELL}>
                  {editable ? (
                    <input
                      type="text"
                      value={aliasValue}
                      disabled={disabled}
                      aria-label={`Equivalencia ${row.codigoProducto}`}
                      onChange={(event) =>
                        onDraftChange?.(row.idAlias, {
                          alias: event.target.value,
                        })
                      }
                      className={cn(
                        "h-full w-full bg-transparent px-3 py-2.5 text-polaria-w outline-none",
                        "hover:bg-polaria-t-08 focus:bg-polaria-t-08 focus:ring-1 focus:ring-inset focus:ring-polaria-teal",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                      )}
                    />
                  ) : (
                    <span className={cn(CELL_PAD, "block")}>
                      {row.alias || "—"}
                    </span>
                  )}
                </td>
                <td className={CELL}>
                  {editable ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      value={precioTexto}
                      disabled={disabled}
                      aria-label={`Precio ${row.codigoProducto}`}
                      onChange={(event) =>
                        onDraftChange?.(row.idAlias, {
                          precioTexto: event.target.value,
                        })
                      }
                      className={cn(
                        "h-full w-full bg-transparent px-3 py-2.5 text-right tabular-nums text-polaria-w outline-none",
                        "hover:bg-polaria-t-08 focus:bg-polaria-t-08 focus:ring-1 focus:ring-inset focus:ring-polaria-teal",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        CELL_PAD,
                        "block text-right tabular-nums",
                        row.precio == null ? "text-polaria-w-50" : undefined,
                      )}
                    >
                      {row.precio == null ? "—" : formatPrecioEs(row.precio)}
                    </span>
                  )}
                </td>
                <td className={cn(CELL, CELL_PAD)}>{row.unidad || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
