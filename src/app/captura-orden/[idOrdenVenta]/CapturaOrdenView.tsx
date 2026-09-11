import { CapturaOrdenCard } from "./CapturaOrdenCard";
import type { CapturaOrdenMetaView } from "./captura-orden.types";

export type { CapturaOrdenMetaView } from "./captura-orden.types";

interface CapturaOrdenViewProps {
  idOrdenVenta: string;
  meta: CapturaOrdenMetaView | null;
  error: string | null;
  flashOk: boolean;
  flashError: string | null;
  flashPrecision: number | null;
}

/**
 * Shell de captura pública (QR). La interacción vive en CapturaOrdenCard (cliente).
 */
export function CapturaOrdenView({
  idOrdenVenta,
  meta,
  error,
  flashOk,
  flashError,
  flashPrecision,
}: CapturaOrdenViewProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-polaria-bg text-polaria-w">
      <div
        aria-hidden
        className="polaria-aurora pointer-events-none absolute inset-0 opacity-90"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-polaria-t-20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[8%] h-[280px] w-[280px] -translate-x-1/2 rounded-full border border-polaria-t-08"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 sm:py-10">
        <header className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Polaria"
            width={240}
            height={64}
            decoding="async"
            className="h-auto w-40 sm:w-48"
          />
          <p className="polaria-text-caption mt-4 text-polaria-teal">
            Captura de surtido
          </p>
          <h1 className="polaria-text-card-title mt-1 max-w-sm">
            Foto de la hoja surtida
          </h1>
          <p className="polaria-text-body-sm mt-2 max-w-md text-polaria-w-50">
            Sube una foto o tómala desde aquí. Verás el avance y la precisión
            de lectura.
          </p>
        </header>

        <main className="flex flex-1 flex-col">
          {error ? (
            <section
              role="alert"
              className="space-y-3 rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-6"
            >
              <p className="polaria-text-label text-polaria-w-50">No disponible</p>
              <p className="polaria-text-body-sm text-polaria-w">{error}</p>
            </section>
          ) : meta ? (
            <CapturaOrdenCard
              idOrdenVenta={idOrdenVenta}
              meta={meta}
              flashOk={flashOk}
              flashError={flashError}
              flashPrecision={flashPrecision}
            />
          ) : (
            <section
              role="alert"
              className="space-y-3 rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-6"
            >
              <p className="polaria-text-body-sm text-polaria-w">
                No se encontró la orden.
              </p>
            </section>
          )}
        </main>

        <footer className="mt-8 text-center polaria-text-caption text-polaria-w-20">
          polaria
        </footer>
      </div>
    </div>
  );
}
