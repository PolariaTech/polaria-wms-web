"use client";

import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { useAvisosValidacionOv } from "../utils/pedido/avisos-validacion-ov";
import { useTotalesVentaOv } from "./sync-ot-formulario-totales";

/**
 * REQ-425: totales del formulario y avisos de validación, en ese orden.
 * El aviso de total OV vs OC lee `totalOvCompleta` / `totalVenta` de la bolsa.
 */
export function useTotalesYAvisosOv(bolsa: OrdenVentaFormEstado): void {
  Object.assign(bolsa, useTotalesVentaOv(bolsa));
  Object.assign(bolsa, useAvisosValidacionOv(bolsa));
}
