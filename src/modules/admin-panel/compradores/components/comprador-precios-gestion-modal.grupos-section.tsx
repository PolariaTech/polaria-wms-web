"use client";

import { toggleValue } from "./comprador-precios-gestion-modal.utils";

interface CompradorPreciosGruposSectionProps {
  catalogoGrupos: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
}

export function CompradorPreciosGruposSection({
  catalogoGrupos,
  selected,
  onChange,
  disabled,
}: CompradorPreciosGruposSectionProps) {
  const allSelected =
    catalogoGrupos.length > 0 && selected.length === catalogoGrupos.length;

  return (
    <section className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="polaria-text-label uppercase tracking-wide text-polaria-teal">
          Grupo perteneciente
        </h3>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(allSelected ? [] : [...catalogoGrupos])}
          className="polaria-text-body-sm text-polaria-teal hover:underline disabled:opacity-60"
        >
          {allSelected ? "Quitar todos" : "Seleccionar todos"}
        </button>
      </div>
      {catalogoGrupos.length === 0 ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          No hay grupos pertenecientes cargados para esta cuenta.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {catalogoGrupos.map((nombre) => (
            <label
              key={nombre}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-3 py-2 polaria-text-body-sm text-polaria-w"
            >
              <input
                type="checkbox"
                checked={selected.includes(nombre)}
                disabled={disabled}
                onChange={() => onChange(toggleValue(selected, nombre))}
                className="h-4 w-4 accent-polaria-teal"
              />
              {nombre}
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
