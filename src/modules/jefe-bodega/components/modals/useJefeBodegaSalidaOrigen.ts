import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getOrdenVentaDetalle,
  listOrdenesVentaParaSalida,
} from "@/modules/sales";
import type { OrdenVentaDetalleRow, OrdenVentaOperadorRow } from "@/modules/sales";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import type { JefeBodegaSalidaOrdenVentaPrefill } from "../../types/jefe-bodega-salida.types";
import { resolveSalidaOrigenUbicacion } from "../../services/resolve-salida-origen-ubicacion.service";
import {
  formatOrdenVentaLabel,
  resolveOrdenFromList,
} from "./jefe-bodega-salida-modal.helpers";

interface UseJefeBodegaSalidaOrigenParams {
  open: boolean;
  codigoCuenta: string | null;
  idBodega: string | null;
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[];
  prefillOrdenVenta: JefeBodegaSalidaOrdenVentaPrefill | null;
  setError: (error: string | null) => void;
}

export function useJefeBodegaSalidaOrigen({
  open,
  codigoCuenta,
  idBodega,
  ubicacionesAlmacen,
  prefillOrdenVenta,
  setError,
}: UseJefeBodegaSalidaOrigenParams) {
  const [idOrdenVenta, setIdOrdenVenta] = useState("");
  const [origenLabel, setOrigenLabel] = useState("");
  const [idUbicacionOrigen, setIdUbicacionOrigen] = useState("");
  const [ordenDetalle, setOrdenDetalle] = useState<OrdenVentaDetalleRow | null>(
    null,
  );
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [ordenesConfirmadas, setOrdenesConfirmadas] = useState<
    OrdenVentaOperadorRow[]
  >([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);

  const almacenUbicacionIds = useMemo(
    () => new Set(ubicacionesAlmacen.map((u) => u.id_ubicacion)),
    [ubicacionesAlmacen],
  );

  const codigoByUbicacion = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of ubicacionesAlmacen) {
      map.set(u.id_ubicacion, u.codigo);
    }
    return map;
  }, [ubicacionesAlmacen]);

  const resetOrigen = useCallback(() => {
    setIdOrdenVenta("");
    setOrigenLabel("");
    setIdUbicacionOrigen("");
    setOrdenDetalle(null);
  }, []);

  const resolveOrigenUbicacion = useCallback(
    async (
      targetIdOrdenVenta: string,
      ovCodigo: string | null | undefined,
      detalle: OrdenVentaDetalleRow | null,
      prefillUbicacionOrigen?: string | null,
    ) => {
      if (!codigoCuenta || !idBodega) {
        setIdUbicacionOrigen("");
        return null;
      }

      const resolved = await resolveSalidaOrigenUbicacion({
        codigoCuenta,
        idBodega,
        idOrdenVenta: targetIdOrdenVenta,
        ovCodigo,
        ordenDetalle: detalle,
        almacenUbicacionIds,
        prefillUbicacionOrigen,
      });

      setIdUbicacionOrigen(resolved ?? "");
      return resolved;
    },
    [almacenUbicacionIds, codigoCuenta, idBodega],
  );

  const loadOrdenDetalle = useCallback(
    async (targetIdOrdenVenta: string) => {
      if (!codigoCuenta || !targetIdOrdenVenta.trim()) {
        setOrdenDetalle(null);
        return null;
      }

      setLoadingDetalle(true);
      try {
        const detalle = await getOrdenVentaDetalle({
          codigoCuenta,
          idOrdenVenta: targetIdOrdenVenta.trim(),
        });
        setOrdenDetalle(detalle);
        return detalle;
      } catch {
        setOrdenDetalle(null);
        return null;
      } finally {
        setLoadingDetalle(false);
      }
    },
    [codigoCuenta],
  );

  const applyOrdenSeleccionada = useCallback(
    async (
      orden: OrdenVentaOperadorRow,
      prefillUbicacionOrigen?: string | null,
    ) => {
      setIdOrdenVenta(orden.idOrdenVenta);
      setOrigenLabel(formatOrdenVentaLabel(orden));
      setError(null);

      const detalle = await loadOrdenDetalle(orden.idOrdenVenta);
      const resolved = await resolveOrigenUbicacion(
        orden.idOrdenVenta,
        orden.venta,
        detalle,
        prefillUbicacionOrigen,
      );

      if (!resolved) {
        setError(
          "No se pudo determinar el casillero de almacenamiento con stock reservado para esta venta.",
        );
      }
    },
    [loadOrdenDetalle, resolveOrigenUbicacion, setError],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadOrdenes() {
      if (!codigoCuenta) {
        if (!cancelled) setOrdenesConfirmadas([]);
        return;
      }

      setLoadingOrdenes(true);
      try {
        const rows = await listOrdenesVentaParaSalida({
          codigoCuenta,
          idBodega: idBodega ?? undefined,
        });
        if (!cancelled) {
          setOrdenesConfirmadas(rows);
        }
      } catch {
        if (!cancelled) setOrdenesConfirmadas([]);
      } finally {
        if (!cancelled) setLoadingOrdenes(false);
      }
    }

    void loadOrdenes();
    return () => {
      cancelled = true;
    };
  }, [open, codigoCuenta, idBodega]);

  useEffect(() => {
    if (!open || !prefillOrdenVenta) return;
    if (loadingOrdenes) return;

    const orden = resolveOrdenFromList(ordenesConfirmadas, prefillOrdenVenta);
    if (orden) {
      void applyOrdenSeleccionada(
        orden,
        prefillOrdenVenta.idUbicacionOrigen,
      );
      return;
    }

    const idFromPrefill = prefillOrdenVenta.idOrdenVenta?.trim();
    if (idFromPrefill) {
      setIdOrdenVenta(idFromPrefill);
      setOrigenLabel(
        prefillOrdenVenta.ovCodigo?.trim() ||
          prefillOrdenVenta.idOrdenVenta?.trim() ||
          "",
      );
      void (async () => {
        const detalle = await loadOrdenDetalle(idFromPrefill);
        const resolved = await resolveOrigenUbicacion(
          idFromPrefill,
          prefillOrdenVenta.ovCodigo,
          detalle,
          prefillOrdenVenta.idUbicacionOrigen,
        );
        if (!resolved) {
          setError(
            "No se pudo determinar el casillero de almacenamiento con stock reservado para esta venta.",
          );
        }
      })();
    }
  }, [
    open,
    prefillOrdenVenta,
    loadingOrdenes,
    ordenesConfirmadas,
    applyOrdenSeleccionada,
    loadOrdenDetalle,
    resolveOrigenUbicacion,
    setError,
  ]);

  return {
    idOrdenVenta,
    origenLabel,
    idUbicacionOrigen,
    ordenDetalle,
    loadingDetalle,
    ordenesConfirmadas,
    loadingOrdenes,
    codigoByUbicacion,
    applyOrdenSeleccionada,
    resetOrigen,
  };
}
