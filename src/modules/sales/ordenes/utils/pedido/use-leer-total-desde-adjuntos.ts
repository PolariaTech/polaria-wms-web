"use client";

import { useEffect } from "react";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";

/**
 * REQ-279: si al reabrir la OV el total solo está en PDF/EML adjuntos,
 * pide a resolve-occ el `totalSolicitud` (misma lectura de storage que OCC).
 * Requiere que resolve-occ devuelva `totalSolicitud` (autorizar esa zona).
 */
export function useLeerTotalDesdeAdjuntos(estado: OrdenVentaFormEstado) {
  const {
    step,
    open,
    origenAdjuntos,
    totalSolicitudDetectado,
    setTotalSolicitudDetectado,
  } = estado;

  useEffect(() => {
    if (step !== "form" || !open) return;
    if (
      typeof totalSolicitudDetectado === "number" &&
      totalSolicitudDetectado > 0
    ) {
      return;
    }

    const paths = [
      ...new Set(
        origenAdjuntos
          .filter((item) => {
            if (!item.path?.trim()) return false;
            const name = item.nombre.toLowerCase();
            const mime = (item.mime ?? "").toLowerCase();
            return (
              name.endsWith(".eml") ||
              mime.includes("message") ||
              name.endsWith(".pdf") ||
              mime.includes("pdf")
            );
          })
          .map((item) => item.path!.trim()),
      ),
    ];
    if (paths.length === 0) return;

    let cancelled = false;
    void (async () => {
      for (const path of paths) {
        try {
          const response = await fetch(
            `/api/ov-adjuntos/resolve-occ?path=${encodeURIComponent(path)}`,
          );
          if (!response.ok) continue;
          const data = (await response.json()) as {
            totalSolicitud?: number | null;
          };
          if (cancelled) return;
          const total = data.totalSolicitud;
          if (typeof total === "number" && Number.isFinite(total) && total > 0) {
            setTotalSolicitudDetectado(total);
            return;
          }
        } catch {
          /* silencioso: el aviso solo aparece si hay total */
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    origenAdjuntos,
    setTotalSolicitudDetectado,
    step,
    totalSolicitudDetectado,
  ]);
}
