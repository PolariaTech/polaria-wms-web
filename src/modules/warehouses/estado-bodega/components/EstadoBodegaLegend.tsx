export function EstadoBodegaLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 polaria-text-caption text-polaria-w-50">
      <span className="inline-flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full bg-polaria-teal"
          aria-hidden
        />
        Ocupada (primario)
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full bg-[var(--aurora-blue)] ring-1 ring-polaria-t-20"
          aria-hidden
        />
        Ocupada (procesado)
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full border border-polaria-w-20 bg-polaria-t-08"
          aria-hidden
        />
        Vacía
      </span>
    </div>
  );
}
