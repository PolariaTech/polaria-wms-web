"use client";

import { useEffect, useMemo, useState } from "react";
import { parseOrigenArchivos } from "../origen/origen-adjuntos";
import { parseOrigenCorreoJson } from "../origen/origen-correo-ordenes-trabajo";
import {
  leerTotalOcDesdeAdjuntos,
  rutasAdjuntosConTotal,
} from "./total-oc-desde-adjuntos";
import { extractTotalSolicitudFromTexto } from "./total-solicitud-vs-ov";

type OrdenConOrigen = {
  origen_texto?: string | null;
  origen_archivos?: string | null;
  origen_correo?: unknown;
  orden_compra_hotel?: string | null;
};

/** OC de la OV: la de cabecera y las de sus tareas, sin repetir. */
export function ocsDeLaOrden(orden: OrdenConOrigen): string[] {
  const ocs = [
    orden.orden_compra_hotel ?? "",
    ...parseOrigenCorreoJson(orden.origen_correo).map(
      (renglon) => renglon["Numero pedido"] ?? "",
    ),
  ]
    .map((oc) => oc.trim())
    .filter(Boolean);
  return [...new Set(ocs)];
}

/**
 * REQ-425: total de la OC para el detalle de la OV. Primero el cuerpo del
 * correo; si no lo trae, el PDF/EML adjunto de las OC de esta OV.
 */
export function useTotalOcDetalle(orden: OrdenConOrigen): number | null {
  const totalCuerpo = extractTotalSolicitudFromTexto(orden.origen_texto);
  const rutasClave = rutasAdjuntosConTotal(
    parseOrigenArchivos(orden.origen_archivos ?? null),
  ).join("\n");
  const ocsClave = ocsDeLaOrden(orden).join("\n");
  const claveLectura = `${rutasClave}|${ocsClave}`;
  const [leido, setLeido] = useState<{ clave: string; total: number | null }>({
    clave: "",
    total: null,
  });
  const rutas = useMemo(() => rutasClave.split("\n").filter(Boolean), [rutasClave]);
  const ocsOv = useMemo(() => ocsClave.split("\n").filter(Boolean), [ocsClave]);

  useEffect(() => {
    if (totalCuerpo != null || rutas.length === 0) return;
    let cancelled = false;
    void leerTotalOcDesdeAdjuntos({
      rutas,
      ocsOv,
      cancelado: () => cancelled,
    }).then((total) => {
      if (!cancelled) setLeido({ clave: claveLectura, total });
    });
    return () => {
      cancelled = true;
    };
  }, [claveLectura, ocsOv, rutas, totalCuerpo]);

  if (totalCuerpo != null) return totalCuerpo;
  return leido.clave === claveLectura ? leido.total : null;
}
