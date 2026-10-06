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

function CapturaCameraMark() {
  return (
    <div
      className="relative mx-auto flex h-20 w-20 items-center justify-center"
      aria-hidden
    >
      <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-polaria-teal" />
      <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-polaria-teal" />
      <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-polaria-teal" />
      <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-polaria-teal" />
      <svg
        viewBox="0 0 24 24"
        className="h-9 w-9 text-polaria-teal"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.5 8.5h2.2l1.1-2h6.4l1.1 2H19.5A1.5 1.5 0 0 1 21 10v7.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5V10A1.5 1.5 0 0 1 4.5 8.5Z" />
        <circle cx="12" cy="13.5" r="3.1" />
      </svg>
    </div>
  );
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
        className="pointer-events-none absolute left-[-20%] top-[-8%] h-[280px] w-[280px] rounded-full border border-polaria-t-20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-12%] right-[-18%] h-[240px] w-[240px] rounded-full border border-polaria-t-08"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col px-6 pb-10 pt-12">
        <header className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Polaria"
            width={200}
            height={54}
            decoding="async"
            className="h-auto w-36"
          />
          <div className="mt-10">
            <CapturaCameraMark />
          </div>
          <h1 className="polaria-text-display mt-6 text-center">
            Captura
          </h1>
          <p className="polaria-text-subtitle mt-3">
            Toma una foto clara desde aquí.
          </p>
        </header>

        <main className="mt-8 flex flex-1 flex-col gap-6">
          {error ? (
            <section
              role="alert"
              className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-5"
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
              flashPrecision={flashPrecision}
            />
          ) : (
            <section
              role="alert"
              className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-5"
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
