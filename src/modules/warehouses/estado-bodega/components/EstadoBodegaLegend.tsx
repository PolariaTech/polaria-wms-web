export function EstadoBodegaLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 polaria-text-caption text-polaria-w-50">
      <span className="inline-flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full border border-polaria-t-20 bg-[var(--aurora-teal)]"
          aria-hidden
        />
        Ocupada (primario)
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full border border-polaria-t-20 bg-[var(--aurora-blue)]"
          aria-hidden
        />
        Ocupada (procesado)
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full border border-dashed border-polaria-w-20 bg-polaria-w-08"
          aria-hidden
        />
        Vacía
      </span>
    </div>
  );
}
