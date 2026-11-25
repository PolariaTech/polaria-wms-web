import { useEffect, useMemo, useState } from "react";
import { useRecargaFolioFactura } from "../../surtido/folio-factura-captura";
import { normalizeIdOrdenTrabajo } from "../../utils/origen/origen-correo-ordenes-trabajo";
import type { CapturaApiRow } from "./cypher-alistamiento-captura";

export function useCypherAlistamientoCapturas(idOrdenVenta: string) {
  const recargaFolio = useRecargaFolioFactura(idOrdenVenta);
  const [capturas, setCapturas] = useState<CapturaApiRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(
      `/captura-orden/${encodeURIComponent(idOrdenVenta)}/api?all=1`,
    )
      .then(async (response) => {
        if (!response.ok) return [] as CapturaApiRow[];
        const body = (await response.json()) as {
          capturas?: CapturaApiRow[];
        };
        return body.capturas ?? [];
      })
      .then((rows) => {
        if (!cancelled) setCapturas(rows);
      })
      .catch(() => {
        if (!cancelled) setCapturas([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idOrdenVenta, recargaFolio]);

  const capturaByOt = useMemo(() => {
    const map = new Map<string, CapturaApiRow>();
    for (const row of capturas) {
      const key = normalizeIdOrdenTrabajo(row.idOrdenTrabajo);
      if (!map.has(key)) map.set(key, row);
    }
    return map;
  }, [capturas]);

  return { capturas, capturaByOt, loading };
}