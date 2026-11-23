import { PolariaTableBodySkeleton } from "@/components/shared/table/PolariaTableBodySkeleton";
import { POLARIA_TABLE_SCROLL_CLASS } from "@/components/shared/table/polaria-table-layout";

/**
 * Fallback de ruta: misma forma que la tabla (header + filas skeleton),
 * no un bloque suelto ni un spinner centrado.
 */
export function PolariaRouteFallback() {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-sm"
      aria-busy="true"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-polaria-w-08 px-5 py-4 sm:px-6">
        <div className="min-w-0 shrink space-y-2">
          <div className="h-5 w-36 animate-pulse rounded bg-polaria-w-08" />
          <div className="h-3 w-52 animate-pulse rounded bg-polaria-w-08" />
        </div>
        <div className="h-9 w-40 animate-pulse rounded-xl bg-polaria-w-08" />
      </header>
      <div className={POLARIA_TABLE_SCROLL_CLASS} role="status" aria-live="polite">
        <table className="w-full text-left">
          <thead className="border-b border-polaria-w-08">
            <tr>
              {["w-20", "w-28", "w-24", "w-16", "w-28", "w-12"].map((w, i) => (
                <th key={i} scope="col" className="px-5 py-3 sm:px-6">
                  <div className={`h-3 animate-pulse rounded bg-polaria-w-08 ${w}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <PolariaTableBodySkeleton columnCount={6} rowCount={8} />
          </tbody>
        </table>
        <span className="sr-only">Cargando…</span>
      </div>
    </section>
  );
}
