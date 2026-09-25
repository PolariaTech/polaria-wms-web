"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";

export interface CompradorTableMultiPickerRow {
  codigo: string;
  nombre: string;
  grupo: string;
}

interface CompradorTableMultiPickerModalProps {
  open: boolean;
  onClose: () => void;
  rows: readonly CompradorTableMultiPickerRow[];
  selectedCodigos: readonly string[];
  onConfirm: (codigos: string[]) => void;
  title?: string;
  description?: string;
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
  const normalized = normalizeSearch(haystack);
  return tokens.every((token) => normalized.includes(token));
}

export function CompradorTableMultiPickerModal({
  open,
  onClose,
  rows,
  selectedCodigos,
  onConfirm,
  title = "Seleccionar compradores",
  description = "Elige uno o varios compradores. No tienen que ser del grupo seleccionado.",
}: CompradorTableMultiPickerModalProps) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDraft([...selectedCodigos]);
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, selectedCodigos]);

  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        matchesSearch(`${row.codigo} ${row.nombre} ${row.grupo}`, query),
      ),
    [query, rows],
  );

  const toggleCodigo = (codigo: string) => {
    setDraft((prev) =>
      prev.includes(codigo)
        ? prev.filter((item) => item !== codigo)
        : [...prev, codigo],
    );
  };

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
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm(draft);
        handleClose();
      }}
      stackLevel="elevated"
      hideHeaderClose
      submitLabel="Confirmar"
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
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
          placeholder="Buscar por código, nombre o grupo"
          aria-label="Buscar compradores"
          autoComplete="off"
          className={cn(
            "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2.5 pl-10 pr-4",
            "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
            "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
          )}
        />
      </div>

      <p className="mb-2 polaria-text-body-sm text-polaria-w-50">
        {draft.length === 0
          ? "Ningún comprador seleccionado."
          : `${draft.length} comprador(es) seleccionado(s).`}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          {query.trim()
            ? "No hay filas que coincidan con la búsqueda."
            : "No hay compradores."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-polaria-w-08">
          <div className="max-h-[min(50vh,22rem)] overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-polaria-bg">
                <tr className="border-b border-polaria-w-08">
                  <th className="w-10 px-3 py-2 polaria-text-caption font-medium text-polaria-w-50" />
                  <th className="px-3 py-2 polaria-text-caption font-medium text-polaria-w-50">
                    Código
                  </th>
                  <th className="px-3 py-2 polaria-text-caption font-medium text-polaria-w-50">
                    Nombre
                  </th>
                  <th className="px-3 py-2 polaria-text-caption font-medium text-polaria-w-50">
                    Grupo
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const checked = draft.includes(row.codigo);
                  return (
                    <tr
                      key={row.codigo}
                      className={cn(
                        "cursor-pointer border-b border-polaria-w-08 last:border-b-0 transition hover:bg-polaria-t-08",
                        checked && "bg-polaria-t-08",
                      )}
                      onClick={() => toggleCodigo(row.codigo)}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCodigo(row.codigo)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4 accent-polaria-teal"
                          aria-label={`Seleccionar ${row.codigo}`}
                        />
                      </td>
                      <td className="px-3 py-2 polaria-text-body-sm font-medium text-polaria-teal">
                        {row.codigo}
                      </td>
                      <td className="px-3 py-2 polaria-text-body-sm text-polaria-w">
                        {row.nombre}
                      </td>
                      <td className="px-3 py-2 polaria-text-body-sm text-polaria-w-50">
                        {row.grupo || "—"}
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
