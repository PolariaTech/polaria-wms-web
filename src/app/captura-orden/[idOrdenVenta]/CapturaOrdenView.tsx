import { CapturaOrdenCard } from "./CapturaOrdenCard";
import type { CapturaOrdenMetaView } from "./captura-orden.types";

export type { CapturaOrdenMetaView } from "./captura-orden.types";

interface CapturaOrdenViewProps {
  idOrdenVenta: string;
  idOrdenTrabajo: string;
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
  idOrdenTrabajo,
  meta,
  error,
  flashOk,
  flashError,
}: CapturaOrdenViewProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-polaria-bg text-polaria-w">
      <div
        aria-hidden
        className="polaria-aurora pointer-events-none absolute inset-0 opacity-90"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-20%] top-[-8%] h-[280px] w-[280px] rounded-full border border-polaria-t-20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-12%] right-[-18%] h-[240px] w-[240px] rounded-full border border-polaria-t-08"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 py-10">
        <header className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- página pública mínima sin Image optimizer */}
          <img
            src="/logo.png"
            alt="Polaria"
            width={160}
            height={43}
            decoding="async"
            className="h-auto w-28 sm:w-32"
          />
        </header>

        <main className="w-full">
          {error ? (
            <section
              role="alert"
              className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-5 text-center"
            >
              <p className="polaria-text-body-sm text-polaria-w">{error}</p>
            </section>
          ) : meta ? (
            <CapturaOrdenCard
              idOrdenVenta={idOrdenVenta}
              idOrdenTrabajo={idOrdenTrabajo}
              meta={meta}
              flashOk={flashOk}
              flashError={flashError}
            />
          ) : (
            <section
              role="alert"
              className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-5 text-center"
            >
              <p className="polaria-text-body-sm text-polaria-w">
                No se encontró la orden.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
