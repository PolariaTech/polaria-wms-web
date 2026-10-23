"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import type { CompradorListRow } from "@/modules/admin-panel";

interface OrdenVentaCompradorPickerModalProps {
  open: boolean;
  onClose: () => void;
  compradores: CompradorListRow[];
  /** IDs a destacar arriba (sugerencias de Mateo), en orden de relevancia. */
  priorityIds?: readonly string[];
  selectedId?: string | null;
  onSelect: (comprador: CompradorListRow) => void;
  title?: string;
  description?: string;
  /** Con Cypher abierto: panel a la izquierda (no tapa Cypher). */
  dockWithCypher?: boolean;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function OrdenVentaCompradorPickerModal({
  open,
  onClose,
  compradores,
  priorityIds = [],
  selectedId = null,
  onSelect,
  title = "Seleccionar cliente",
  description = "Catálogo completo de clientes de la cuenta.",
  dockWithCypher = false,
}: OrdenVentaCompradorPickerModalProps) {
  const [query, setQuery] = useState("");
  const prioritySet = useMemo(() => new Set(priorityIds), [priorityIds]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    const rows = !needle
      ? compradores
      : compradores.filter((row) => {
          const haystack =
            `${row.codigo} ${row.comprador} ${row.apodo ?? ""} ${row.rfc ?? ""} ${row.telefono ?? ""}`.toLowerCase();
          return haystack.includes(needle);
        });
    if (priorityIds.length === 0) return rows;
    const rank = new Map(priorityIds.map((id, i) => [id, i]));
    return [...rows].sort((a, b) => {
      const ra = rank.has(a.idComprador) ? rank.get(a.idComprador)! : 10_000;
      const rb = rank.has(b.idComprador) ? rank.get(b.idComprador)! : 10_000;
      if (ra !== rb) return ra - rb;
      return a.comprador.localeCompare(b.comprador, "es");
    });
  }, [compradores, query, priorityIds]);

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
          Mostrando{" "}
          {filtered.length === 0 ? "0–0" : `1–${filtered.length}`} de{" "}
          {compradores.length}
        </p>
      }
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      {compradores.length > 4 ? (
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por código, cliente, D. Comercial o RFC"
            aria-label="Buscar cliente"
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
            ? "No hay clientes que coincidan con la búsqueda."
            : "No hay clientes registrados."}
        </p>
      ) : (
        <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[34%]" />
              <col className="w-[24%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-polaria-bg">
              <tr className="border-b border-polaria-t-20 bg-polaria-bg">
                <th className="bg-polaria-bg px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Código
                </th>
                <th className="bg-polaria-bg px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Cliente
                </th>
                <th className="bg-polaria-bg px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  D. Comercial
                </th>
                <th className="bg-polaria-bg px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  RFC
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isSelected = row.idComprador === selectedId;
                const isPriority = prioritySet.has(row.idComprador);
                return (
                  <tr
                    key={row.idComprador}
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
                    aria-label={`Seleccionar ${row.comprador}`}
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
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm font-medium text-polaria-teal">
                      {row.codigo}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm">
                      <span className="line-clamp-2">{row.comprador}</span>
                      {isPriority ? (
                        <span className="mt-0.5 inline-block rounded bg-polaria-teal/15 px-1.5 py-0.5 polaria-text-caption font-semibold text-polaria-teal">
                          Sugerido
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                      {row.apodo?.trim() || "—"}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w-50">
                      {row.rfc?.trim() || "—"}
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
