"use client";

import { cn } from "@/lib/utils/cn";
import { POLARIA_FORM_INPUT_CLASS } from "@/components/shared/form/PolariaFormField";
import {
  formatLineaIngresoTitulo,
  type RecepcionLineaDraft,
} from "@/modules/purchases/ingreso/utils/recepcion-compra-draft";

interface CustodioOrdenIngresoLineasListProps {
  lineas: RecepcionLineaDraft[];
  isSubmitting: boolean;
  onUpdateLinea: (
    idLineaOrdenCompra: string,
    patch: Partial<RecepcionLineaDraft>,
  ) => void;
}

export function CustodioOrdenIngresoLineasList({
  lineas,
  isSubmitting,
  onUpdateLinea,
}: CustodioOrdenIngresoLineasListProps) {
  return (
    <ul className="space-y-2">
      {lineas.map((linea) => (
        <li
          key={linea.idLineaOrdenCompra}
          className={cn(
            "rounded-xl border px-3 py-2.5 transition",
            linea.incluida
              ? "border-polaria-t-20 bg-polaria-t-08"
              : "border-polaria-w-08 bg-polaria-w-08 opacity-80",
          )}
        >
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={linea.incluida}
              onChange={(event) =>
                onUpdateLinea(linea.idLineaOrdenCompra, {
                  incluida: event.target.checked,
                })
              }
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-polaria-t-20 accent-polaria-teal"
            />
            <span className="min-w-0 flex-1">
              <span className="block polaria-text-caption font-medium leading-snug text-polaria-w">
                {formatLineaIngresoTitulo(linea)}
              </span>
              <span className="mt-1 block polaria-text-caption text-polaria-w-50">
                Conciliación ciega — ingrese peso y temperatura
              </span>
            </span>
          </label>

          {linea.incluida ? (
            <div className="mt-2 grid grid-cols-1 gap-2 pl-6">
              <label className="flex flex-col gap-1">
                <span className="polaria-text-caption text-polaria-w-50">
                  Temperatura (°C)
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: -18"
                  value={linea.temperaturaInput}
                  onChange={(event) =>
                    onUpdateLinea(linea.idLineaOrdenCompra, {
                      temperaturaInput: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  className={POLARIA_FORM_INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="polaria-text-caption text-polaria-w-50">
                  Peso recibido (kg)
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={linea.cantidadRecibidaInput}
                  onChange={(event) =>
                    onUpdateLinea(linea.idLineaOrdenCompra, {
                      cantidadRecibidaInput: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  className={POLARIA_FORM_INPUT_CLASS}
                />
              </label>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
