"use client";

import { useEffect, useMemo } from "react";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";
import {
  leerTotalOcDesdeAdjuntos,
  rutasAdjuntosConTotal,
} from "./total-oc-desde-adjuntos";

/**
 * REQ-279: si al reabrir la OV el total solo está en PDF/EML adjuntos,
 * pide a resolve-occ el total. REQ-425: con varias OC en el mismo correo
 * se toma el de las OC de esta OV, no el primero que aparezca.
 */
export function useLeerTotalDesdeAdjuntos(estado: OrdenVentaFormEstado) {
  const {
    step,
    open,
    origenAdjuntos,
    ordenCompraHotel,
    ordenesTrabajoForm,
    totalSolicitudDetectado,
    setTotalSolicitudDetectado,
  } = estado;

  // Claves en texto: el arreglo cambia de identidad en cada carga y cancelaría la lectura.
  const rutasClave = rutasAdjuntosConTotal(origenAdjuntos ?? []).join("\n");
  const ocsClave = [
    ordenCompraHotel,
    ...(ordenesTrabajoForm ?? []).map((hija) => hija.numeroPedido ?? ""),
  ]
    .map((oc) => (oc ?? "").trim())
    .filter(Boolean)
    .join("\n");
  const yaDetectado =
    typeof totalSolicitudDetectado === "number" && totalSolicitudDetectado > 0;
  const rutas = useMemo(() => rutasClave.split("\n").filter(Boolean), [rutasClave]);
  const ocsOv = useMemo(() => ocsClave.split("\n").filter(Boolean), [ocsClave]);

  useEffect(() => {
    if (step !== "form" || !open || yaDetectado) return;
    if (rutas.length === 0) return;

    let cancelled = false;
    void leerTotalOcDesdeAdjuntos({
      rutas,
      ocsOv,
      cancelado: () => cancelled,
    }).then((total) => {
      if (!cancelled && total != null) setTotalSolicitudDetectado(total);
    });

    return () => {
      cancelled = true;
    };
  }, [ocsOv, open, rutas, setTotalSolicitudDetectado, step, yaDetectado]);
}
