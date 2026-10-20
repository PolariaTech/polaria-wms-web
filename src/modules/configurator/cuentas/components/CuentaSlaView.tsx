"use client";

import { useCallback, useEffect, useState } from "react";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { CuentaCockpitHeader } from "@/modules/configurator/cuentas/components/CuentaCockpitHeader";
import { CuentaCockpitLoadingCard } from "@/modules/configurator/cuentas/components/CuentaCockpitLoadingCard";
import {
  getCuentaGobiernoConfigurator,
  getCuentaOvSlaConfigurator,
  updateCuentaOvSlaConfigurator,
} from "@/modules/configurator/cuentas/services/cuentas.service";
import {
  OV_ALERTA_MINUTOS_DEFAULT,
  OV_SLA_MINUTOS_DEFAULT,
} from "@/modules/sales/shared/utils/ov-sla";

interface CuentaSlaViewProps {
  codigoCuenta: string;
}

export function CuentaSlaView({ codigoCuenta }: CuentaSlaViewProps) {
  const fetchCuenta = useCallback(
    () => getCuentaGobiernoConfigurator(codigoCuenta),
    [codigoCuenta],
  );
  const { data: cuenta, isLoading, error } = useAsyncQuery(fetchCuenta);

  const fetchSla = useCallback(
    () => getCuentaOvSlaConfigurator(codigoCuenta),
    [codigoCuenta],
  );
  const {
    data: slaConfig,
    isLoading: isSlaLoading,
    error: slaError,
    reload: reloadSla,
  } = useAsyncQuery(fetchSla);

  const [slaMinutos, setSlaMinutos] = useState(String(OV_SLA_MINUTOS_DEFAULT));
  const [alertaMinutos, setAlertaMinutos] = useState(
    String(OV_ALERTA_MINUTOS_DEFAULT),
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    if (!slaConfig) return;
    setSlaMinutos(String(slaConfig.ovSlaMinutos));
    setAlertaMinutos(String(slaConfig.ovAlertaMinutos));
  }, [slaConfig]);

  const onSave = async () => {
    setFormError(null);
    setSavedOk(false);
    const sla = Number.parseInt(slaMinutos, 10);
    const alerta = Number.parseInt(alertaMinutos, 10);
    if (!Number.isFinite(sla) || sla < 1) {
      setFormError("El SLA debe ser un entero de al menos 1 minuto.");
      return;
    }
    if (!Number.isFinite(alerta) || alerta < 1) {
      setFormError("La alerta debe ser un entero de al menos 1 minuto.");
      return;
    }
    if (alerta > sla) {
      setFormError("La alerta no puede ser mayor que el SLA.");
      return;
    }
    if (!cuenta) return;

    setSaving(true);
    try {
      await updateCuentaOvSlaConfigurator({
        codigoCuenta,
        codigoEmpresa: cuenta.codigoEmpresa,
        ovSlaMinutos: sla,
        ovAlertaMinutos: alerta,
      });
      setSavedOk(true);
      await reloadSla();
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

  const loading = isLoading || isSlaLoading;

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

          <section className="mx-auto w-full max-w-xl space-y-6 rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-6 sm:px-6">
            <div>
              <h2 className="polaria-text-card-title">SLA y alertas OV</h2>
              <p className="polaria-text-subtitle mt-2">
                Tiempo máximo en cada etapa de la orden de venta. La alerta avisa
                antes de romper el SLA.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="polaria-text-caption text-polaria-w-50">
                SLA (minutos en etapa)
              </span>
              <input
                type="number"
                min={1}
                step={1}
                value={slaMinutos}
                onChange={(e) => {
                  setSavedOk(false);
                  setSlaMinutos(e.target.value);
                }}
                className="w-full rounded-xl border border-polaria-w-08 bg-polaria-bg px-4 py-3 text-polaria-w outline-none focus:border-polaria-teal"
              />
              <span className="polaria-text-caption text-polaria-w-20">
                Por defecto 60 (1 hora). Pasado este tiempo la OV se marca atrasada.
              </span>
            </label>

            <label className="block space-y-2">
              <span className="polaria-text-caption text-polaria-w-50">
                Alerta (minutos en etapa)
              </span>
              <input
                type="number"
                min={1}
                step={1}
                value={alertaMinutos}
                onChange={(e) => {
                  setSavedOk(false);
                  setAlertaMinutos(e.target.value);
                }}
                className="w-full rounded-xl border border-polaria-w-08 bg-polaria-bg px-4 py-3 text-polaria-w outline-none focus:border-polaria-teal"
              />
              <span className="polaria-text-caption text-polaria-w-20">
                Por defecto 45. Entre alerta y SLA la OV aparece en riesgo.
              </span>
            </label>

            {formError || slaError || error ? (
              <p className="polaria-text-body-sm text-polaria-warning" role="alert">
                {formError || slaError || error || "Error al cargar."}
              </p>
            ) : null}

            {savedOk ? (
              <p className="polaria-text-body-sm text-polaria-teal">Guardado.</p>
            ) : null}

            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave()}
              className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </section>
        </>
      ) : null}

      {!loading && !cuenta && !error ? (
        <p className="polaria-text-body text-polaria-w-50">Cuenta no encontrada.</p>
      ) : null}
    </main>
  );
}
