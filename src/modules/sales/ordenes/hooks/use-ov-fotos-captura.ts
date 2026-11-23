import { useCallback, useRef, useState } from "react";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OvAccionesCtx } from "../components/pages/ov-impresion-ctx";
import type { FotosPreviewState } from "../components/pages/ov-impresion-feedback";
import {
  fetchFotosCaptura,
  mensajeErrorFotos,
} from "../components/pages/ov-fotos-captura-fetch";

/** Estado base de la vista de fotos de una OV; `parcial` pisa lo que cambie. */
function estadoFotos(
  row: OrdenVentaOperadorRow,
  parcial: Partial<FotosPreviewState>,
): FotosPreviewState {
  return {
    idOrdenVenta: row.idOrdenVenta,
    title: `Fotos · ${row.venta}`,
    ordenesTrabajo: [],
    selectedOt: null,
    fotos: [],
    loadingOts: false,
    loadingFotos: false,
    lockToOt: false,
    error: null,
    ...parcial,
  };
}

/** Fotos de captura de una OV: lista de OT, o directo las de una OT (desde Cypher). */
export function useOvFotosCaptura(
  ctx: Pick<OvAccionesCtx, "printingLockRef" | "setBusyAction">,
) {
  const { printingLockRef, setBusyAction } = ctx;
  const [fotosPreview, setFotosPreview] = useState<FotosPreviewState | null>(null);
  const fotosOrdenIdRef = useRef<string | null>(null);

  const openFotosCaptura = useCallback(
    async (row: OrdenVentaOperadorRow, idOrdenTrabajo?: string | null) => {
      if (printingLockRef.current) return;
      printingLockRef.current = true;
      fotosOrdenIdRef.current = row.idOrdenVenta;
      setBusyAction({ id: row.idOrdenVenta, kind: "fotos" });

      const ot = idOrdenTrabajo?.trim() || "";
      // Desde Cypher: solo fotos de la OT seleccionada (sin listar las demás).
      const base: Partial<FotosPreviewState> = ot
        ? { selectedOt: ot, lockToOt: true }
        : {};
      setFotosPreview(
        estadoFotos(row, ot ? { ...base, loadingFotos: true } : { loadingOts: true }),
      );

      try {
        const { ordenesTrabajo, fotos } = await fetchFotosCaptura(
          row.idOrdenVenta,
          ot || undefined,
        );
        setFotosPreview(
          estadoFotos(row, ot ? { ...base, fotos } : { ordenesTrabajo }),
        );
      } catch (error: unknown) {
        setFotosPreview(estadoFotos(row, { ...base, error: mensajeErrorFotos(error) }));
      } finally {
        printingLockRef.current = false;
        setBusyAction(null);
      }
    },
    [printingLockRef, setBusyAction],
  );

  const selectFotosOt = useCallback(async (idOrdenTrabajo: string) => {
    const idOrdenVenta = fotosOrdenIdRef.current;
    if (!idOrdenVenta) return;

    setFotosPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        selectedOt: idOrdenTrabajo,
        fotos: [],
        loadingFotos: true,
        error: null,
      };
    });

    try {
      const { fotos } = await fetchFotosCaptura(idOrdenVenta, idOrdenTrabajo);
      setFotosPreview((prev) => {
        if (!prev || prev.idOrdenVenta !== idOrdenVenta) return prev;
        return {
          ...prev,
          selectedOt: idOrdenTrabajo,
          fotos,
          loadingFotos: false,
          error: null,
        };
      });
    } catch (error: unknown) {
      setFotosPreview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fotos: [],
          loadingFotos: false,
          error: mensajeErrorFotos(error),
        };
      });
    }
  }, []);

  const volverALasOt = useCallback(() => {
    setFotosPreview((prev) =>
      prev
        ? { ...prev, selectedOt: null, fotos: [], loadingFotos: false, error: null }
        : prev,
    );
  }, []);

  const cerrarFotos = useCallback(() => {
    fotosOrdenIdRef.current = null;
    setFotosPreview(null);
  }, []);

  return {
    fotosPreview,
    openFotosCaptura,
    selectFotosOt,
    volverALasOt,
    cerrarFotos,
  };
}
