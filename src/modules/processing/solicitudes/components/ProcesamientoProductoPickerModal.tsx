"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import type { ProductoProcesamientoOption } from "../../shared/types/processing.types";
import { matchesPickerSearch } from "./procesamiento-picker-search";

interface ProcesamientoProductoPickerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  productos: ProductoProcesamientoOption[];
  isLoading?: boolean;
  loadError?: string | null;
  selectedId?: string | null;
  onSelect: (producto: ProductoProcesamientoOption) => void;
  emptyMessage?: string;
}

function buildProductoHaystack(row: ProductoProcesamientoOption): string {
  return [row.descripcion, row.sku, row.label, row.idProducto].join(" ");
}

const TABLE_COLGROUP = (
  <colgroup>
    <col className="w-[55%]" />
    <col className="w-[25%]" />
    <col className="w-[20%]" />
  </colgroup>
);

export function ProcesamientoProductoPickerModal({
  open,
  onClose,
  title,
  description,
  productos,
  isLoading = false,
  loadError = null,
  selectedId = null,
  onSelect,
  emptyMessage = "No hay productos disponibles.",
}: ProcesamientoProductoPickerModalProps) {
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const filtered = useMemo(() => {
    return productos.filter((row) =>
      matchesPickerSearch(buildProductoHaystack(row), query),
    );
  }, [productos, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      stackLevel="elevated"
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      <div className="mb-3 flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
            aria-hidden
          />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            placeholder="Buscar por título o SKU"
            aria-label="Buscar producto"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2.5 pl-10 pr-4",
              "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
              "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
            )}
          />
        </div>

        {!isLoading && productos.length > 0 ? (
          <p className="polaria-text-caption text-polaria-w-50">
            {filtered.length} de {productos.length} productos
          </p>
        ) : null}
      </div>

      {loadError ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-danger"
        >
          {loadError}
        </p>
      ) : isLoading ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          Cargando productos…
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {query.trim()
            ? "No hay productos que coincidan con la búsqueda."
            : emptyMessage}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-polaria-w-08">
          <div className="overflow-x-auto bg-polaria-t-08">
            <table className="w-full min-w-[36rem] table-fixed border-collapse text-left">
              {TABLE_COLGROUP}
              <thead>
                <tr className="border-b border-polaria-t-20">
                  <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                    Título
                  </th>
                  <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                    SKU
                  </th>
                  <th className="px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50">
                    Conv.
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="max-h-[min(55dvh,26rem)] overflow-auto">
            <table className="w-full min-w-[36rem] table-fixed border-collapse text-left">
              {TABLE_COLGROUP}
              <tbody>
                {filtered.map((row) => {
                  const isSelected = row.idProducto === selectedId;
                  const conversion =
                    row.reglaConversionUnidadesSecundario != null
                      ? String(row.reglaConversionUnidadesSecundario)
                      : "—";

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
                      aria-label={`Seleccionar ${row.descripcion || row.sku}`}
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
                        <span className="line-clamp-2">
                          {row.descripcion || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                        {row.sku}
                      </td>
                      <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                        {conversion}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PolariaFormModal>
  );
}
