"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { CuentaBodegasAsignadasModal } from "@/modules/configurator/cuentas/components/CuentaBodegasAsignadasModal";
import { CuentaCockpitHeader } from "@/modules/configurator/cuentas/components/CuentaCockpitHeader";
import { CuentaCockpitSectionGrid } from "@/modules/configurator/cuentas/components/CuentaCockpitSectionGrid";
import { CuentaCockpitLoadingCard } from "@/modules/configurator/cuentas/components/CuentaCockpitLoadingCard";
import { CuentaEditModal } from "@/modules/configurator/cuentas/components/CuentaEditModal";
import {
  CUENTA_COCKPIT_SECTIONS,
  getCuentaGobiernoModuloHref,
  type CuentaCockpitModuloId,
} from "@/modules/configurator/cuentas/constants/cuenta-cockpit";
import { getCuentaGobiernoConfigurator } from "@/modules/configurator/cuentas/services/cuentas.service";

interface CuentaCockpitViewProps {
  codigoCuenta: string;
}

export function CuentaCockpitView({ codigoCuenta }: CuentaCockpitViewProps) {
  const router = useRouter();
  const [isAccesoOpen, setIsAccesoOpen] = useState(false);
  const [isBodegasOpen, setIsBodegasOpen] = useState(false);

  const fetchCuenta = useCallback(
    () => getCuentaGobiernoConfigurator(codigoCuenta),
    [codigoCuenta],
  );
  const { data: cuenta, isLoading, error, reload } = useAsyncQuery(fetchCuenta);

  const handleOptionClick = (optionId: CuentaCockpitModuloId) => {
    if (optionId === "acceso") {
      setIsAccesoOpen(true);
      return;
    }
    if (optionId === "bodegas") {
      setIsBodegasOpen(true);
      return;
    }

    router.push(getCuentaGobiernoModuloHref(codigoCuenta, optionId));
  };

  return (
    <main
      className={
        isLoading
          ? "flex flex-1 flex-col"
          : "flex flex-1 flex-col justify-start gap-6 pt-6 pb-10 sm:gap-8 sm:pt-8 sm:pb-12"
      }
    >
      {isLoading ? <CuentaCockpitLoadingCard /> : null}

      {error ? (
        <p
          role="alert"
          className="mx-auto max-w-xl rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 text-center polaria-text-body-sm text-polaria-danger"
        >
          {error}
        </p>
      ) : null}

      {!isLoading && !error && !cuenta ? (
        <p className="polaria-text-subtitle mx-auto px-4 text-center">
          No se encontró la cuenta.
        </p>
      ) : null}

      {cuenta ? (
        <>
          <CuentaCockpitHeader cuenta={cuenta} />

          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 sm:gap-10 sm:px-6">
            {CUENTA_COCKPIT_SECTIONS.map((section, index) => (
              <div key={section.title} className="flex flex-col gap-8 sm:gap-10">
                {index > 0 ? (
                  <div
                    aria-hidden
                    className="mx-auto h-px w-full max-w-md bg-polaria-w-08"
                  />
                ) : null}
                <CuentaCockpitSectionGrid
                  title={section.title}
                  options={section.options}
                  onOptionClick={handleOptionClick}
                />
              </div>
            ))}
          </div>

          <CuentaEditModal
            open={isAccesoOpen}
            cuenta={cuenta}
            onClose={() => setIsAccesoOpen(false)}
            onUpdated={() => {
              void reload();
            }}
          />

          <CuentaBodegasAsignadasModal
            open={isBodegasOpen}
            onClose={() => setIsBodegasOpen(false)}
            codigoCuenta={cuenta.codigoCuenta}
            cuentaNombre={cuenta.nombreComercial}
            bodegas={cuenta.bodegasAsignadas}
            idBodegaDefault={cuenta.idBodegaDefault}
            onSaved={() => {
              void reload();
            }}
          />
        </>
      ) : null}
    </main>
  );
}
