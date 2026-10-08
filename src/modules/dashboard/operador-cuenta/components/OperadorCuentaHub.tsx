"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";
import { PolariaSelectionGrid } from "@/components/shared/cards/PolariaSelectionGrid";
import { countOrdenesVentaPorConfirmar } from "@/modules/sales";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  OPERADOR_CUENTA_HUB_OPTIONS,
  type OperadorCuentaHubOptionId,
} from "../constants/operador-cuenta-hub";

export function OperadorCuentaHub() {
  const router = useRouter();
  const { codigoCuenta } = useCompany();
  const [ventasPorConfirmar, setVentasPorConfirmar] = useState(0);

  useEffect(() => {
    if (!codigoCuenta?.trim()) {
      setVentasPorConfirmar(0);
      return;
    }

    let cancelled = false;

    void countOrdenesVentaPorConfirmar(codigoCuenta)
      .then((count) => {
        if (!cancelled) setVentasPorConfirmar(count);
      })
      .catch(() => {
        if (!cancelled) setVentasPorConfirmar(0);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta]);

  const handleOptionClick = useCallback(
    (optionId: string) => {
      const option = OPERADOR_CUENTA_HUB_OPTIONS.find(
        (item) => item.id === optionId,
      );
      if (!option) return;

      router.push(option.href);
    },
    [router],
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="text-center">
        <h1 className="polaria-text-display">Operación de cuenta</h1>
        <p className="polaria-text-subtitle mt-2 text-polaria-w-50">
          Selecciona un flujo para comenzar.
        </p>
      </header>

      <PolariaSelectionGrid
        aria-label="Accesos operador de cuenta"
        className="px-0 sm:px-0"
      >
        {OPERADOR_CUENTA_HUB_OPTIONS.map((option) => {
          const isVentas = option.id === "ventas";
          const badgeCount = isVentas ? ventasPorConfirmar : 0;

          return (
            <PolariaSelectionCard
              key={option.id}
              option={{
                id: option.id,
                title: option.title,
                icon: option.icon,
              }}
              badgeCount={badgeCount}
              highlighted={isVentas && badgeCount > 0}
              onClick={(optionId) =>
                handleOptionClick(optionId as OperadorCuentaHubOptionId)
              }
            />
          );
        })}
      </PolariaSelectionGrid>
    </main>
  );
}
