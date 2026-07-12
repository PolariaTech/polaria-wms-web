"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { cn } from "@/lib/utils/cn";
import type { OrdenVentaOperadorRow } from "@/modules/sales";

interface JefeBodegaOrdenVentaPickerModalProps {
  open: boolean;
  onClose: () => void;
  ordenes: OrdenVentaOperadorRow[];
  loading?: boolean;
  selectedId?: string | null;
  onSelect: (orden: OrdenVentaOperadorRow) => void;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function JefeBodegaOrdenVentaPickerModal({
  open,
  onClose,
  ordenes,
  loading = false,
  selectedId = null,
  onSelect,
}: JefeBodegaOrdenVentaPickerModalProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return ordenes;
    return ordenes.filter((row) => {
      const haystack =
        `${row.venta} ${row.comprador} ${row.productos} ${row.destino}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [ordenes, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Seleccionar orden de venta"
      description="Órdenes de venta confirmadas disponibles para salida."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      {ordenes.length > 4 ? (
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por venta, comprador o producto"
            aria-label="Buscar orden de venta"
            className={cn(
              "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2.5 pl-10 pr-4",
              "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
              "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
            )}
          />
        </div>
      ) : null}

      {loading ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          Cargando órdenes de venta…
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {query.trim()
            ? "No hay órdenes que coincidan con la búsqueda."
            : "No hay órdenes de venta confirmadas."}
        </p>
      ) : (
        <div className="max-h-[min(55dvh,26rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead className="sticky top-0 bg-polaria-t-08">
              <tr className="border-b border-polaria-t-20">
                <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                  Venta
                </th>
                <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                  Comprador
                </th>
                <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                  Productos
                </th>
                <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                  Cantidad
                </th>
                <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isSelected = row.idOrdenVenta === selectedId;
                return (
                  <tr
                    key={row.idOrdenVenta}
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
                    aria-label={`Seleccionar ${row.venta}`}
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
                      {row.venta}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                      {row.comprador}
                    </td>
                    <td className="max-w-[10rem] truncate px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                      {row.productos}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm whitespace-nowrap">
                      {formatKgEs(row.cantidadKg)} kg
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm whitespace-nowrap">
                      ${formatPrecioEs(row.total)}
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
