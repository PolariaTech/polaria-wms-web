"use client";

import {
  POLARIA_FORM_INPUT_CLASS_COMPACT,
  POLARIA_FORM_SELECT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { cn } from "@/lib/utils/cn";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "../../../shared/types/sales.types";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";

const UNIDADES_CAPTURA = ["KGM", "PZA", "LTR", "CJ"] as const;

/** Normaliza a mayúsculas; `kg`/`kilos` → KGM (REQ-380). */
function unidadCapturaNormalizada(raw: string): string {
  const t = raw.trim().toUpperCase().replace(/\./g, "");
  if (!t) return "KGM";
  if (/^(KG|KILO|KILOS|KGS)$/.test(t)) return "KGM";
  if (/^(LT|L|LITRO|LITROS|LTS)$/.test(t)) return "LTR";
  if (/^(PZ|PZS|PIEZA|PIEZAS|UN|UND|UNIDAD|UNIDADES)$/.test(t)) return "PZA";
  if (/^(CAJA|CAJAS|CJA)$/.test(t)) return "CJ";
  return t;
}

/** REQ-380: unidad editable cuando hay onChange; si no, solo lectura. */
export function CeldaUnidad({
  linea,
  index,
  onChange,
}: {
  linea: LineaVentaForm;
  index: number;
  onChange?: (index: number, value: string) => void;
}) {
  const actual = unidadCapturaNormalizada(
    linea.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
  );
  if (!onChange) {
    return (
      <div className="flex h-full min-h-full items-stretch">
        <input
          aria-label={`Unidad de ${linea.nombre}`}
          value={actual}
          disabled
          tabIndex={-1}
          className={cn(
            POLARIA_FORM_INPUT_CLASS_COMPACT,
            "h-full min-h-full px-1.5 text-center",
          )}
        />
      </div>
    );
  }
  const opciones = UNIDADES_CAPTURA.includes(
    actual as (typeof UNIDADES_CAPTURA)[number],
  )
    ? UNIDADES_CAPTURA
    : ([actual, ...UNIDADES_CAPTURA] as readonly string[]);
  return (
    <div className="flex h-full min-h-full items-stretch">
      <select
        aria-label={`Unidad de ${linea.nombre}`}
        data-ov-revision={`unidad-${index}`}
        value={actual}
        onChange={(e) => onChange(index, e.target.value.toUpperCase())}
        className={cn(
          POLARIA_FORM_SELECT_CLASS_COMPACT,
          "h-full min-h-full px-1.5 text-center",
        )}
      >
        {opciones.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  );
}
