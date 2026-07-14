import { useEffect, useState } from "react";
import type { FlujoOrdenTrabajoApi } from "@/modules/operations";
import { listUbicacionesOrigenBloqueadasPorTarea } from "../services/jefe-bodega-pending-slots.service";

export function useJefeBodegaUbicacionesBloqueadas(params: {
  open: boolean;
  codigoCuenta: string | null;
  idBodega: string | null;
  tipoFlujos: readonly FlujoOrdenTrabajoApi[];
}) {
  const [bloqueadas, setBloqueadas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const tipoFlujosKey = params.tipoFlujos.join(",");

  useEffect(() => {
    let cancelled = false;

    if (!params.open || !params.codigoCuenta || !params.idBodega) {
      setBloqueadas(new Set());
      return;
    }

    setLoading(true);

    void listUbicacionesOrigenBloqueadasPorTarea({
      codigoCuenta: params.codigoCuenta,
      idBodega: params.idBodega,
      tipoFlujos: params.tipoFlujos,
    })
      .then((ids) => {
        if (!cancelled) setBloqueadas(ids);
      })
      .catch(() => {
        if (!cancelled) setBloqueadas(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // tipoFlujosKey refleja el contenido de params.tipoFlujos sin re-disparar por identidad de array.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver tipoFlujosKey
  }, [params.open, params.codigoCuenta, params.idBodega, tipoFlujosKey]);

  return { bloqueadas, loading };
}
