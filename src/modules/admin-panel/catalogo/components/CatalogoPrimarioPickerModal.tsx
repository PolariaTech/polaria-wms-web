"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaFormSelect } from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";
import {
  listProductosPrimariosCatalogo,
  type ProductoPrimarioOption,
} from "../services/productos-catalogo.service";

interface CatalogoPrimarioPickerModalProps {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  selectedId?: string | null;
  onSelect: (primario: ProductoPrimarioOption) => void;
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

function buildPrimarioHaystack(row: ProductoPrimarioOption): string {
  return [
    row.titulo,
    row.codigo,
    row.sku,
    row.categoria,
    row.proveedor,
    row.label,
  ].join(" ");
}

function uniqueSorted(values: string[]): { value: string; label: string }[] {
  return Array.from(new Set(values.filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((value) => ({ value, label: value }));
}

const PRIMARIO_TABLE_COLGROUP = (
  <colgroup>
    <col className="w-[12%]" />
    <col className="w-[30%]" />
    <col className="w-[14%]" />
    <col className="w-[20%]" />
    <col className="w-[24%]" />
  </colgroup>
);

export function CatalogoPrimarioPickerModal({
  open,
  onClose,
  codigoCuenta,
  selectedId = null,
  onSelect,
}: CatalogoPrimarioPickerModalProps) {
  const [query, setQuery] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [proveedorFilter, setProveedorFilter] = useState("");
  const [primarios, setPrimarios] = useState<ProductoPrimarioOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open || !codigoCuenta) {
      setPrimarios([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    void listProductosPrimariosCatalogo({ codigoCuenta })
      .then((rows) => {
        if (!cancelled) setPrimarios(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setPrimarios([]);
          setLoadError("No se pudieron cargar los productos primarios.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, open]);

  const categoriaOptions = useMemo(
    () => uniqueSorted(primarios.map((row) => row.categoria)),
    [primarios],
  );

  const proveedorOptions = useMemo(
    () => uniqueSorted(primarios.map((row) => row.proveedor)),
    [primarios],
  );

  const filtered = useMemo(() => {
    return primarios.filter((row) => {
      if (categoriaFilter && row.categoria !== categoriaFilter) return false;
      if (proveedorFilter && row.proveedor !== proveedorFilter) return false;
      return matchesSearch(buildPrimarioHaystack(row), query);
    });
  }, [categoriaFilter, primarios, proveedorFilter, query]);

  const handleClose = () => {
    setQuery("");
    setCategoriaFilter("");
    setProveedorFilter("");
    onClose();
  };

  const hasFilters =
    categoriaOptions.length > 0 || proveedorOptions.length > 0;

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Seleccionar producto primario"
      description="Solo productos primarios activos del catálogo."
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
            aria-label="Buscar producto primario"
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {categoriaOptions.length > 0 ? (
              <PolariaFormSelect
                id="catalogo-primario-filter-categoria"
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
                id="catalogo-primario-filter-proveedor"
                label="Proveedor"
                value={proveedorFilter}
                onChange={(event) => setProveedorFilter(event.target.value)}
                placeholder="Todos"
                options={proveedorOptions}
                compact
              />
            ) : null}
          </div>
        ) : null}

        {!isLoading && primarios.length > 0 ? (
          <p className="polaria-text-caption text-polaria-w-50">
            {filtered.length} de {primarios.length} productos primarios
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
          Cargando productos primarios…
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {query.trim() || categoriaFilter || proveedorFilter
            ? "No hay productos que coincidan con la búsqueda o los filtros."
            : "No hay productos primarios en el catálogo."}
        </p>
      ) : (
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
      )}
    </PolariaFormModal>
  );
}
