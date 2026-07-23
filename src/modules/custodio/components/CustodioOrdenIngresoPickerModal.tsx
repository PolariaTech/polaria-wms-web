"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import type { OrdenCompraRow } from "@/modules/purchases";
import {
  formatFechaOrden,
} from "@/modules/purchases/ordenes/utils/orden-compra-display";

interface CustodioOrdenIngresoPickerModalProps {
  open: boolean;
  onClose: () => void;
  ordenes: OrdenCompraRow[];
  selectedId?: string | null;
  onSelect: (orden: OrdenCompraRow) => void;
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function CustodioOrdenIngresoPickerModal({
  open,
  onClose,
  ordenes,
  selectedId = null,
  onSelect,
}: CustodioOrdenIngresoPickerModalProps) {
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
    const needle = normalizeSearch(query);
    if (!needle) return ordenes;
    return ordenes.filter((orden) => {
      const haystack = normalizeSearch(
        `${orden.codigo} ${orden.codigo_cuenta} ${orden.proveedor_nombre ?? ""} ${orden.estado}`,
      );
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
      title="Seleccionar orden de compra"
      description="Órdenes en transporte para esta bodega."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      stackLevel="elevated"
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
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            placeholder="Buscar por código, cuenta o proveedor"
            aria-label="Buscar orden de compra"
            autoComplete="off"
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
            ? "No hay órdenes que coincidan con la búsqueda."
            : "No hay órdenes en transporte para esta bodega."}
        </p>
      ) : (
        <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full min-w-[32rem] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[18%]" />
              <col className="w-[36%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead className="sticky top-0 bg-polaria-t-08">
              <tr className="border-b border-polaria-t-20">
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Orden
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Cuenta
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Proveedor
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Llegada
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((orden) => {
                const isSelected = orden.id_orden_compra === selectedId;
                return (
                  <tr
                    key={orden.id_orden_compra}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onSelect(orden);
                      handleClose();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(orden);
                        handleClose();
                      }
                    }}
                    aria-label={`Seleccionar orden ${orden.codigo}`}
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
                      {orden.codigo}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                      {orden.codigo_cuenta}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                      <span className="line-clamp-2">
                        {orden.proveedor_nombre?.trim() || "Sin proveedor"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                      {formatFechaOrden(orden.fecha_entrega_estimada)}
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
