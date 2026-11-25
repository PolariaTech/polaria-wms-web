import { useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import type { CypherCompanionOtPicker } from "../components/modals/OrdenVentaCypherDrawer";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  parseOrigenCorreoJson,
} from "../utils/origen/origen-correo-ordenes-trabajo";

export interface UseOrdenVentaDetalleOtArgs {
  origenCorreo: unknown;
  idOrdenVenta: string | null;
  hijaId: string | null;
  setHijaId: Dispatch<SetStateAction<string | null>>;
  cypherOpen: boolean;
  inspect: boolean;
  onCompanionOtPickerChange?: (picker: CypherCompanionOtPicker | null) => void;
}

/** OT del correo de la OV, la activa y la publicación del selector al Cypher compañero. */
export function useOrdenVentaDetalleOt({
  origenCorreo,
  idOrdenVenta,
  hijaId,
  setHijaId,
  cypherOpen,
  inspect,
  onCompanionOtPickerChange,
}: UseOrdenVentaDetalleOtArgs) {
  const ordenesTrabajo = useMemo(
    () => groupOrigenCorreoToOrdenesTrabajo(parseOrigenCorreoJson(origenCorreo)),
    [origenCorreo],
  );

  const hijaActiva = useMemo(() => {
    if (ordenesTrabajo.length === 0) return null;
    if (ordenesTrabajo.length === 1) return ordenesTrabajo[0] ?? null;
    if (hijaId) {
      return ordenesTrabajo.find((h) => h.id === hijaId) ?? ordenesTrabajo[0] ?? null;
    }
    return ordenesTrabajo[0] ?? null;
  }, [hijaId, ordenesTrabajo]);

  const indiceOt = Math.max(
    0,
    ordenesTrabajo.findIndex((hija) => hija.id === hijaActiva?.id),
  );

  // El grid de OT vive solo en Cypher; aquí siempre hay OT activa (1ª por defecto).
  useEffect(() => {
    if (ordenesTrabajo.length === 0) return;
    if (hijaId && ordenesTrabajo.some((h) => h.id === hijaId)) return;
    setHijaId(ordenesTrabajo[0]?.id ?? null);
  }, [hijaId, ordenesTrabajo, setHijaId]);

  // Publicar selector de OT al Cypher compañero.
  useEffect(() => {
    if (!onCompanionOtPickerChange) return;

    const shouldPublish =
      Boolean(idOrdenVenta) && cypherOpen && !inspect && ordenesTrabajo.length >= 1;

    if (!shouldPublish) {
      onCompanionOtPickerChange(null);
      return;
    }

    onCompanionOtPickerChange({
      hijas: ordenesTrabajo.map((hija) => ({
        id: hija.id,
        label: hija.label,
        productosCount: hija.renglones.length,
        totalCantidad: hija.totalCantidad,
        almacen: hija.almacen,
      })),
      selectedId: hijaId ?? ordenesTrabajo[0]?.id ?? null,
      onSelect: (id: string) => {
        setHijaId(id);
      },
    });

    return () => {
      onCompanionOtPickerChange(null);
    };
  }, [
    cypherOpen,
    hijaId,
    idOrdenVenta,
    inspect,
    onCompanionOtPickerChange,
    ordenesTrabajo,
    setHijaId,
  ]);

  return { ordenesTrabajo, hijaActiva, indiceOt };
}
