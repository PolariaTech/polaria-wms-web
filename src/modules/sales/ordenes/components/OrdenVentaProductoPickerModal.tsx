"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { cn } from "@/lib/utils/cn";
import type { ProductoVentaOption } from "../../shared/types/sales.types";

interface OrdenVentaProductoPickerModalProps {
  open: boolean;
  onClose: () => void;
  productos: ProductoVentaOption[];
  selectedId?: string | null;
  onSelect: (producto: ProductoVentaOption) => void;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function OrdenVentaProductoPickerModal({
  open,
  onClose,
  productos,
  selectedId = null,
  onSelect,
}: OrdenVentaProductoPickerModalProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return productos;
    return productos.filter((row) => {
      const haystack = `${row.nombre} ${row.codigo}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [productos, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Seleccionar producto"
      description="Solo productos con kilos disponibles en almacenamiento."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="md"
    >
      {productos.length > 4 ? (
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o código"
            aria-label="Buscar producto"
            className={cn(
              "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2.5 pl-10 pr-4",
              "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
              "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
            )}
          />
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {query.trim()
            ? "No hay productos que coincidan con la búsqueda."
            : "No hay productos con stock disponible."}
        </p>
      ) : (
        <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[38%]" />
              <col className="w-[18%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
            </colgroup>
            <thead className="sticky top-0 bg-polaria-t-08">
              <tr className="border-b border-polaria-t-20">
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Nombre
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Código
                </th>
                <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                  Precio/kg
                </th>
                <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                  Kg disponible
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isSelected = row.idProducto === selectedId;
                return (
                  <tr
                    key={row.idProducto}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onSelect(row);
                      handleClose();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(row);
                        handleClose();
                      }
                    }}
                    aria-label={`Seleccionar ${row.nombre}`}
                    aria-pressed={isSelected}
                    className={cn(
                      "cursor-pointer border-b border-polaria-w-08 transition last:border-b-0",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-polaria-teal",
                      isSelected
                        ? "bg-polaria-t-08 text-polaria-w"
                        : "text-polaria-w hover:bg-polaria-t-08",
                    )}
                  >
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                      <span className="line-clamp-2">{row.nombre}</span>
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm font-medium text-polaria-teal">
                      {row.codigo}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w-50">
                      ${formatPrecioEs(row.precioUnitario)}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w-50">
                      {formatKgEs(row.kgDisponible)} kg
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PolariaFormModal>
  );
}
