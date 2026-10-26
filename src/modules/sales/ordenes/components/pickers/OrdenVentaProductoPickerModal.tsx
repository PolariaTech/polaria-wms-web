"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { cn } from "@/lib/utils/cn";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { stripLeadingProductoCodigo } from "../../../shared/utils/producto-venta-nombre";
import { matchesProductoCatalogSearch } from "../../utils/find-closest-producto-catalogo";

interface OrdenVentaProductoPickerModalProps {
  open: boolean;
  onClose: () => void;
  productos: ProductoVentaOption[];
  /** IDs a destacar arriba (sugerencias de Mateo), en orden de relevancia. */
  priorityIds?: readonly string[];
  selectedId?: string | null;
  onSelect: (producto: ProductoVentaOption) => void;
  title?: string;
  description?: string;
  /** Con Cypher abierto: panel a la izquierda (no tapa Cypher). */
  dockWithCypher?: boolean;
}

export function OrdenVentaProductoPickerModal({
  open,
  onClose,
  productos,
  priorityIds = [],
  selectedId = null,
  onSelect,
  title = "Seleccionar producto",
  description = "Catálogo completo de productos de la cuenta.",
  dockWithCypher = false,
}: OrdenVentaProductoPickerModalProps) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const prioritySet = useMemo(() => new Set(priorityIds), [priorityIds]);

  // REQ-129: al abrir el catálogo, foco directo en buscar.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    }, 40);
    return () => window.clearTimeout(id);
  }, [open]);

  const filtered = useMemo(() => {
    const rows = !query.trim()
      ? productos
      : productos.filter((row) => matchesProductoCatalogSearch(query, row));
    if (priorityIds.length === 0) return rows;
    const rank = new Map(priorityIds.map((id, i) => [id, i]));
    return [...rows].sort((a, b) => {
      const ra = rank.has(a.idProducto) ? rank.get(a.idProducto)! : 10_000;
      const rb = rank.has(b.idProducto) ? rank.get(b.idProducto)! : 10_000;
      if (ra !== rb) return ra - rb;
      return 0;
    });
  }, [productos, query, priorityIds]);

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
      hideHeaderClose
      layout={dockWithCypher ? "dock-left" : "center"}
      stackLevel="base"
      closeOnBackdrop={!dockWithCypher}
      footerLeading={
        <p className="polaria-text-caption text-polaria-w-50">
          Mostrando {filtered.length === 0 ? "0–0" : `1–${filtered.length}`}
        </p>
      }
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      {productos.length > 4 ? (
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
            aria-hidden
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, código o equivalencia"
            aria-label="Buscar producto"
            autoFocus
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
            : "No hay productos en el catálogo."}
        </p>
      ) : (
        <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full min-w-[36rem] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[22%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-polaria-bg">
              <tr className="border-b border-polaria-t-20 bg-polaria-bg">
                <th className="bg-polaria-bg px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Nombre
                </th>
                <th className="bg-polaria-bg px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Equivalencia
                </th>
                <th className="bg-polaria-bg px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Código
                </th>
                <th className="bg-polaria-bg px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                  Precio/kg
                </th>
                <th className="bg-polaria-bg px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                  Kg disponible
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isSelected = row.idProducto === selectedId;
                const isPriority = prioritySet.has(row.idProducto);
                const equivalencia = row.equivalencia?.trim() || "—";
                const nombre = stripLeadingProductoCodigo(
                  row.nombre,
                  row.codigo,
                );
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
                    aria-label={`Seleccionar ${nombre}`}
                    aria-pressed={isSelected}
                    className={cn(
                      "cursor-pointer border-b border-polaria-w-08 transition last:border-b-0",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-polaria-teal",
                      isSelected
                        ? "bg-polaria-t-08 text-polaria-w"
                        : isPriority
                          ? "bg-polaria-t-08/50 text-polaria-w hover:bg-polaria-t-08"
                          : "text-polaria-w hover:bg-polaria-t-08",
                    )}
                  >
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                      <span className="line-clamp-2">{nombre}</span>
                      {isPriority ? (
                        <span className="mt-0.5 inline-block rounded bg-polaria-teal/15 px-1.5 py-0.5 polaria-text-caption font-semibold text-polaria-teal">
                          Sugerido
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                      <span className="line-clamp-2">{equivalencia}</span>
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
