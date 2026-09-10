import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import { CapturaOrdenFotoField } from "./CapturaOrdenFotoField";
import type { CapturaOrdenMetaView } from "./captura-orden.types";

export type { CapturaOrdenMetaView } from "./captura-orden.types";

interface CapturaOrdenViewProps {
  idOrdenVenta: string;
  meta: CapturaOrdenMetaView | null;
  error: string | null;
  flashOk: boolean;
  flashError: string | null;
}

/**
 * Vista servidor + form nativo POST.
 * El selector de foto es UI Polaria; el submit no depende de activar un botón con JS.
 */
export function CapturaOrdenView({
  idOrdenVenta,
  meta,
  error,
  flashOk,
  flashError,
}: CapturaOrdenViewProps) {
  const actionUrl = idOrdenVenta ? ROUTES.capturaOrdenApi(idOrdenVenta) : "";

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
            Sube una foto o tómala desde aquí. Se reduce sola antes de enviar.
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
            <section
              className={cn(
                "space-y-5 rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-5",
                "polaria-card-glow sm:p-6",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="polaria-text-label text-polaria-w-50">Folio</p>
                  <p className="polaria-text-card-title mt-1 text-polaria-teal">
                    {meta.folio}
                  </p>
                </div>
                {meta.tieneCaptura || flashOk ? (
                  <span className="polaria-text-badge shrink-0 rounded-lg border border-polaria-t-20 bg-polaria-bg/60 px-2.5 py-1 text-polaria-teal">
                    Ya capturada
                  </span>
                ) : (
                  <span className="polaria-text-badge shrink-0 rounded-lg border border-polaria-w-08 bg-polaria-bg/60 px-2.5 py-1 text-polaria-w-50">
                    Pendiente
                  </span>
                )}
              </div>

              {flashOk ? (
                <p className="rounded-xl border border-polaria-t-20 bg-polaria-bg/40 px-3 py-2 polaria-text-body-sm text-polaria-teal">
                  Listo. El operador ya puede descargar el PDF actualizado.
                </p>
              ) : null}

              {flashError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-polaria-w-08 bg-polaria-bg/40 px-3 py-2 polaria-text-body-sm text-polaria-w-50"
                >
                  {flashError}
                </p>
              ) : null}

              {!flashOk && meta.tieneCaptura ? (
                <p className="polaria-text-body-sm text-polaria-w-50">
                  Hay una captura guardada
                  {meta.capturaActualizadaEn
                    ? ` (${new Date(meta.capturaActualizadaEn).toLocaleString("es-MX")})`
                    : ""}
                  . Puedes subir otra foto para reemplazarla.
                </p>
              ) : null}

              {!flashOk && !meta.tieneCaptura ? (
                <p className="polaria-text-body-sm text-polaria-w-50">
                  Elige una foto o tómala con la cámara. Luego pulsa subir.
                </p>
              ) : null}

              <form
                action={actionUrl}
                method="post"
                encType="multipart/form-data"
                className="space-y-4"
              >
                <CapturaOrdenFotoField />

                <button
                  type="submit"
                  className={cn(
                    "w-full rounded-xl bg-polaria-teal px-4 py-3.5 font-semibold text-polaria-bg",
                    "hover:opacity-90",
                  )}
                >
                  Subir y leer hoja
                </button>

                <p className="polaria-text-caption text-center text-polaria-w-20">
                  Al subir, espera en esta pantalla. Puede tardar un momento.
                </p>
              </form>
            </section>
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
