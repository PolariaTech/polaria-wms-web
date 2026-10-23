"use client";

import { Clock3 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useVisibleInterval } from "@/hooks/shared/useVisibleInterval";
import { cn } from "@/lib/utils/cn";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { CuentaCockpitHeader } from "@/modules/configurator/cuentas/components/CuentaCockpitHeader";
import { CuentaCockpitLoadingCard } from "@/modules/configurator/cuentas/components/CuentaCockpitLoadingCard";
import {
  CUENTA_ZONA_HORARIA_DEFAULT,
  CUENTA_ZONA_HORARIA_OPTIONS,
  getCuentaZonaHorariaOption,
  writeCuentaZonaHoraria,
  type CuentaZonaHorariaId,
} from "@/modules/configurator/cuentas/constants/cuenta-zona-horaria";
import {
  getCuentaGobiernoConfigurator,
  getCuentaZonaHorariaConfigurator,
  updateCuentaZonaHorariaConfigurator,
} from "@/modules/configurator/cuentas/services/cuentas.service";

interface CuentaZonaHorariaViewProps {
  codigoCuenta: string;
}

function formatNowInZone(timeZone: CuentaZonaHorariaId, now: Date): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      timeZone,
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
  } catch {
    return now.toISOString();
  }
}

export function CuentaZonaHorariaView({
  codigoCuenta,
}: CuentaZonaHorariaViewProps) {
  const fetchCuenta = useCallback(
    () => getCuentaGobiernoConfigurator(codigoCuenta),
    [codigoCuenta],
  );
  const { data: cuenta, isLoading, error } = useAsyncQuery(fetchCuenta);

  const fetchZona = useCallback(
    () => getCuentaZonaHorariaConfigurator(codigoCuenta),
    [codigoCuenta],
  );
  const {
    data: zonaConfig,
    isLoading: isZonaLoading,
    error: zonaError,
    reload: reloadZona,
  } = useAsyncQuery(fetchZona);

  const [zona, setZona] = useState<CuentaZonaHorariaId>(
    CUENTA_ZONA_HORARIA_DEFAULT,
  );
  const [savedZona, setSavedZona] = useState<CuentaZonaHorariaId>(
    CUENTA_ZONA_HORARIA_DEFAULT,
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useVisibleInterval(() => setNow(new Date()), 1000, true);

  useEffect(() => {
    if (!zonaConfig) return;
    const next = zonaConfig.zonaHoraria as CuentaZonaHorariaId;
    setZona(next);
    setSavedZona(next);
    writeCuentaZonaHoraria(codigoCuenta, next);
  }, [codigoCuenta, zonaConfig]);

  const dirty = zona !== savedZona;
  const selected = getCuentaZonaHorariaOption(zona);
  const preview = formatNowInZone(zona, now);

  const onSave = async () => {
    if (!cuenta) return;
    setFormError(null);
    setSavedOk(false);
    setSaving(true);
    try {
      await updateCuentaZonaHorariaConfigurator({
        codigoCuenta,
        codigoEmpresa: cuenta.codigoEmpresa,
        zonaHoraria: zona,
      });
      writeCuentaZonaHoraria(codigoCuenta, zona);
      setSavedZona(zona);
      setSavedOk(true);
      await reloadZona();
    } catch (err) {
      setFormError(
        err instanceof DomainServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const loading = isLoading || isZonaLoading;

  return (
    <main
      className={
        loading
          ? "flex flex-1 flex-col"
          : "flex flex-1 flex-col justify-start gap-8 pt-8 pb-10 sm:gap-10 sm:pt-12 sm:pb-14"
      }
    >
      {loading ? <CuentaCockpitLoadingCard /> : null}

      {!loading && cuenta ? (
        <>
          <CuentaCockpitHeader cuenta={cuenta} />

          <section className="mx-auto w-full max-w-3xl space-y-8 px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="polaria-text-label text-polaria-teal">
                Presentación de horas
              </p>
              <h2 className="polaria-text-card-title mt-2">Zona horaria</h2>
              <p className="polaria-text-subtitle mt-3">
                Lista, log e impresión usan esta zona. En base de datos las horas
                siguen en UTC.
              </p>
            </div>

            <div
              className="flex flex-col items-center gap-3 rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-6 text-center sm:px-8"
              aria-live="polite"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-polaria-t-20 bg-polaria-bg text-polaria-teal">
                <Clock3 className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="polaria-text-caption text-polaria-w-50">
                Ahora en {selected.label}
              </p>
              <p className="font-mono text-2xl tracking-tight text-polaria-w sm:text-3xl">
                {preview}
              </p>
              <p className="polaria-text-caption text-polaria-w-20">
                {selected.region} · {selected.offsetLabel}
                {zona === CUENTA_ZONA_HORARIA_DEFAULT ? " · por defecto" : ""}
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label="Zona de la cuenta"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {CUENTA_ZONA_HORARIA_OPTIONS.map((option) => {
                const active = option.id === zona;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setSavedOk(false);
                      setZona(option.id);
                    }}
                    className={cn(
                      "flex min-h-[7.5rem] flex-col items-start justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                      active
                        ? "border-polaria-teal bg-polaria-t-08 shadow-[0_0_24px_var(--teal-glow)]"
                        : "border-polaria-t-20 bg-polaria-bg/40 hover:border-polaria-teal",
                    )}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="polaria-text-body-sm font-semibold text-polaria-w">
                        {option.label}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full",
                          active
                            ? "bg-polaria-teal shadow-[0_0_8px_var(--teal-glow)]"
                            : "bg-polaria-w-20",
                        )}
                        aria-hidden
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="polaria-text-caption text-polaria-w-50">
                        {option.region}
                      </p>
                      <p
                        className={cn(
                          "polaria-text-badge",
                          active ? "text-polaria-teal" : "text-polaria-w-20",
                        )}
                      >
                        {option.offsetLabel}
                        {option.id === CUENTA_ZONA_HORARIA_DEFAULT
                          ? " · default"
                          : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                {formError || zonaError || error ? (
                  <p
                    className="polaria-text-body-sm text-polaria-warning"
                    role="alert"
                  >
                    {formError || zonaError || error || "Error al cargar."}
                  </p>
                ) : savedOk && !dirty ? (
                  <p className="polaria-text-body-sm text-polaria-teal">
                    Guardado. Aplica a toda la cuenta.
                  </p>
                ) : dirty ? (
                  <p className="polaria-text-body-sm text-polaria-w-50">
                    Cambios sin guardar · {selected.label}
                  </p>
                ) : (
                  <p className="polaria-text-body-sm text-polaria-w-20">
                    No depende del reloj del equipo que imprime.
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={saving || !dirty}
                onClick={() => void onSave()}
                className="shrink-0 rounded-xl bg-polaria-teal px-5 py-3 font-semibold text-polaria-on-teal hover:opacity-90 disabled:opacity-40"
              >
                {saving ? "Guardando…" : "Guardar zona"}
              </button>
            </div>
          </section>
        </>
      ) : null}

      {!loading && !cuenta && !error ? (
        <p className="polaria-text-body text-polaria-w-50">Cuenta no encontrada.</p>
      ) : null}
    </main>
  );
}
