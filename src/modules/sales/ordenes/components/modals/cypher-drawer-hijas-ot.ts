"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { armarPickerOtRespaldo } from "../../utils/ot/reagrupacion-modal-estado";
import { groupOrigenCorreoToOrdenesTrabajo, parseOrigenCorreoJson } from "../../utils/origen/origen-correo-ordenes-trabajo";
import type { CypherCompanionOtPicker } from "./cypher-companion-ot.types";

interface UseCypherDrawerHijasOtArgs {
  orden: OrdenVentaDetalleRow | null;
  companionOtPicker: CypherCompanionOtPicker | null;
  onReagruparDesdeLista?: () => void;
}

export function useCypherDrawerHijasOt({
  orden,
  companionOtPicker,
  onReagruparDesdeLista,
}: UseCypherDrawerHijasOtArgs) {
  const hijasFromOrden = useMemo(() => {
    if (!orden) return [];
    return groupOrigenCorreoToOrdenesTrabajo(parseOrigenCorreoJson(orden.origen_correo));
  }, [orden]);

  const [fallbackOtId, setFallbackOtId] = useState<string | null>(null);

  useEffect(() => {
    if (companionOtPicker) {
      setFallbackOtId(null);
      return;
    }
    if (hijasFromOrden.length === 0) {
      setFallbackOtId(null);
      return;
    }
    setFallbackOtId((prev) =>
      prev && hijasFromOrden.some((h) => h.id === prev)
        ? prev
        : (hijasFromOrden[0]?.id ?? null),
    );
  }, [companionOtPicker, hijasFromOrden]);

  const activeOtPicker = useMemo((): CypherCompanionOtPicker | null => {
    if (companionOtPicker && companionOtPicker.hijas.length > 0) {
      return companionOtPicker;
    }
    return armarPickerOtRespaldo({
      hijas: hijasFromOrden,
      selectedId: fallbackOtId,
      onSelect: setFallbackOtId,
      onReagrupar: onReagruparDesdeLista,
    });
  }, [companionOtPicker, fallbackOtId, hijasFromOrden, onReagruparDesdeLista]);

  const idOrdenTrabajoBitacora = activeOtPicker?.selectedId?.trim() || null;

  return { hijasFromOrden, activeOtPicker, idOrdenTrabajoBitacora };
}
