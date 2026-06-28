"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { PolariaSelectionCard } from "@/components/shared/PolariaSelectionCard";
import {
  OPERADOR_CUENTA_HUB_OPTIONS,
  type OperadorCuentaHubOptionId,
} from "../constants/operador-cuenta-hub";

export function OperadorCuentaHub() {
  const router = useRouter();

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
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="polaria-text-display">Operación de cuenta</h1>
        <p className="polaria-text-subtitle mt-2 text-polaria-w-50">
          Selecciona un flujo para comenzar.
        </p>
      </header>

      <section
        aria-label="Accesos operador de cuenta"
        className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:gap-5 sm:px-6"
      >
        {OPERADOR_CUENTA_HUB_OPTIONS.map((option) => (
          <PolariaSelectionCard
            key={option.id}
            option={{
              id: option.id,
              title: option.title,
              icon: option.icon,
            }}
            onClick={(optionId) =>
              handleOptionClick(optionId as OperadorCuentaHubOptionId)
            }
          />
        ))}
      </section>
    </div>
  );
}
