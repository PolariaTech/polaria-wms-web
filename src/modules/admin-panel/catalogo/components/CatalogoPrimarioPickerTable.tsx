"use client";

import { cn } from "@/lib/utils/cn";
import type { ProductoPrimarioOption } from "../services/productos-catalogo.service";

const PRIMARIO_TABLE_COLGROUP = (
  <colgroup>
    <col className="w-[12%]" />
    <col className="w-[30%]" />
    <col className="w-[14%]" />
    <col className="w-[20%]" />
    <col className="w-[24%]" />
  </colgroup>
);

interface CatalogoPrimarioPickerTableProps {
  rows: ProductoPrimarioOption[];
  selectedId: string | null;
  onSelect: (row: ProductoPrimarioOption) => void;
  onAfterSelect: () => void;
}

export function CatalogoPrimarioPickerTable({
  rows,
  selectedId,
  onSelect,
  onAfterSelect,
}: CatalogoPrimarioPickerTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-polaria-w-08">
      <div className="overflow-x-auto bg-polaria-t-08">
        <table className="w-full min-w-[40rem] table-fixed border-collapse text-left">
          {PRIMARIO_TABLE_COLGROUP}
          <thead>
            <tr className="border-b border-polaria-t-20">
              <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                Código
              </th>
              <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                Título
              </th>
              <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                SKU
              </th>
              <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                Categoría
              </th>
              <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                Proveedor
              </th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="max-h-[min(55dvh,26rem)] overflow-auto">
        <table className="w-full min-w-[40rem] table-fixed border-collapse text-left">
          {PRIMARIO_TABLE_COLGROUP}
          <tbody>
            {rows.map((row) => {
              const isSelected = row.idProducto === selectedId;
              return (
                <tr
                  key={row.idProducto}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelect(row);
                    onAfterSelect();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(row);
                      onAfterSelect();
                    }
                  }}
                  aria-label={`Seleccionar ${row.titulo || row.sku}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "cursor-pointer border-b border-polaria-w-08 transition last:border-b-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-polaria-teal",
                    isSelected
                      ? "bg-polaria-t-08 text-polaria-w"
                      : "text-polaria-w hover:bg-polaria-t-08",
                  )}
                >
                  <td className="px-3 py-2.5 align-middle polaria-text-body-sm font-medium text-polaria-teal">
                    {row.codigo}
                  </td>
                  <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                    <span className="line-clamp-2">{row.titulo || "—"}</span>
                  </td>
                  <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                    {row.sku}
                  </td>
                  <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                    {row.categoria || "—"}
                  </td>
                  <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                    {row.proveedor || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
