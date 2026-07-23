"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaFormSelect } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";
import type { CatalogoProductoListRow } from "@/modules/admin-panel";

interface SolicitudProductoPickerModalProps {
  open: boolean;
  onClose: () => void;
  productos: CatalogoProductoListRow[];
  selectedId?: string | null;
  onSelect: (producto: CatalogoProductoListRow) => void;
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function matchesSearch(haystack: string, query: string): boolean {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const normalizedHaystack = normalizeSearch(haystack);
  return tokens.every((token) => normalizedHaystack.includes(token));
}

function buildProductoHaystack(row: CatalogoProductoListRow): string {
  return [
    row.titulo,
    row.codigo,
    row.sku,
    row.categoria,
    row.proveedor,
    row.tipo,
    row.descripcion,
  ].join(" ");
}

function uniqueSorted(values: string[]): { value: string; label: string }[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((value) => ({ value, label: value }));
}

const PRODUCTO_TABLE_COLGROUP = (
  <colgroup>
    <col className="w-[12%]" />
    <col className="w-[30%]" />
    <col className="w-[14%]" />
    <col className="w-[20%]" />
    <col className="w-[24%]" />
  </colgroup>
);

export function SolicitudProductoPickerModal({
  open,
  onClose,
  productos,
  selectedId = null,
  onSelect,
}: SolicitudProductoPickerModalProps) {
  const [query, setQuery] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [proveedorFilter, setProveedorFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const categoriaOptions = useMemo(
    () => uniqueSorted(productos.map((row) => row.categoria)),
    [productos],
  );

  const proveedorOptions = useMemo(
    () => uniqueSorted(productos.map((row) => row.proveedor)),
    [productos],
  );

  const tipoOptions = useMemo(
    () => uniqueSorted(productos.map((row) => row.tipo)),
    [productos],
  );

  const filtered = useMemo(() => {
    return productos.filter((row) => {
      if (categoriaFilter && row.categoria !== categoriaFilter) return false;
      if (proveedorFilter && row.proveedor !== proveedorFilter) return false;
      if (tipoFilter && row.tipo !== tipoFilter) return false;
      return matchesSearch(buildProductoHaystack(row), query);
    });
  }, [categoriaFilter, productos, proveedorFilter, query, tipoFilter]);

  const handleClose = () => {
    setQuery("");
    setCategoriaFilter("");
    setProveedorFilter("");
    setTipoFilter("");
    onClose();
  };

  const hasFilters =
    categoriaOptions.length > 0 ||
    proveedorOptions.length > 0 ||
    tipoOptions.length > 0;

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Seleccionar producto"
      description="Productos activos del catálogo de la cuenta."
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
            placeholder="Buscar por código, título, SKU, categoría o proveedor"
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

        {hasFilters ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {categoriaOptions.length > 0 ? (
              <PolariaFormSelect
                id="sol-producto-filter-categoria"
                label="Categoría"
                value={categoriaFilter}
                onChange={(event) => setCategoriaFilter(event.target.value)}
                placeholder="Todas"
                options={categoriaOptions}
                compact
              />
            ) : null}
            {proveedorOptions.length > 0 ? (
              <PolariaFormSelect
                id="sol-producto-filter-proveedor"
                label="Proveedor"
                value={proveedorFilter}
                onChange={(event) => setProveedorFilter(event.target.value)}
                placeholder="Todos"
                options={proveedorOptions}
                compact
              />
            ) : null}
            {tipoOptions.length > 0 ? (
              <PolariaFormSelect
                id="sol-producto-filter-tipo"
                label="Tipo"
                value={tipoFilter}
                onChange={(event) => setTipoFilter(event.target.value)}
                placeholder="Todos"
                options={tipoOptions}
                compact
              />
            ) : null}
          </div>
        ) : null}

        {productos.length > 0 ? (
          <p className="polaria-text-caption text-polaria-w-50">
            {filtered.length} de {productos.length} productos
          </p>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {query.trim() || categoriaFilter || proveedorFilter || tipoFilter
            ? "No hay productos que coincidan con la búsqueda o los filtros."
            : "No hay productos en el catálogo."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-polaria-w-08">
          <div className="overflow-x-auto bg-polaria-t-08">
            <table className="w-full min-w-[40rem] table-fixed border-collapse text-left">
              {PRODUCTO_TABLE_COLGROUP}
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
              {PRODUCTO_TABLE_COLGROUP}
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
                        <span className="line-clamp-2">
                          {row.titulo || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                        {row.sku || "—"}
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
      )}
    </PolariaFormModal>
  );
}
