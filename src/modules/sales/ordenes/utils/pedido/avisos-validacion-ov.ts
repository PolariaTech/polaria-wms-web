"use client";

import { useMemo } from "react";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";
import type { CampoDiscrepancia } from "./map-pedido-extraido-to-form";
import { formatCapturaFecha } from "./build-orden-venta-captura-observaciones";
import {
  FECHA_ENTREGA_ATRASADA_WARNING,
  FECHA_ENTREGA_DEFAULT_WARNING,
  isFechaEntregaIsoValida,
} from "./pedido-form-validation";
import { findDuplicadosAgainstDraft } from "../match/find-potencial-duplicado-ov";
import {
  buildAvisoTotalSolicitudVsOv,
  extractTotalSolicitudFromTexto,
} from "./total-solicitud-vs-ov";
import { useLeerTotalDesdeAdjuntos } from "./use-leer-total-desde-adjuntos";

function resolveTotalSolicitudParaAviso(params: {
  totalSolicitudDetectado: number | null | undefined;
  origenTexto: string | null | undefined;
}): number | null {
  if (
    typeof params.totalSolicitudDetectado === "number" &&
    Number.isFinite(params.totalSolicitudDetectado) &&
    params.totalSolicitudDetectado > 0
  ) {
    return params.totalSolicitudDetectado;
  }
  return extractTotalSolicitudFromTexto(params.origenTexto);
}

export function useAvisosValidacionOv(estado: OrdenVentaFormEstado) {
  // REQ-279: si el total solo está en PDF/EML, resolve-occ lo rellena al editar.
  useLeerTotalDesdeAdjuntos(estado);

  const {
    discrepancias,
    fechaEntrega,
    fechaEntregaAtrasada,
    warnFields,
    ordenCompraHotel,
    ordenesTrabajoForm,
    compradorLabel,
    editingId,
    operadorRowsForDuplicado,
    origenTexto,
    totalSolicitudDetectado,
    totalOvCompleta,
    totalVenta,
  } = estado;
  const avisosValidacion = useMemo((): CampoDiscrepancia[] => {
    const sinFecha = discrepancias.filter(
      (item) => item.fieldKey !== "fechaEntrega",
    );
    const avisos: CampoDiscrepancia[] = [...sinFecha];
    if (fechaEntregaAtrasada && isFechaEntregaIsoValida(fechaEntrega)) {
      avisos.push({
        campo: "Fecha de entrega",
        fieldKey: "fechaEntrega",
        db: "Hoy o posterior",
        ia: `${formatCapturaFecha(fechaEntrega)} · ${FECHA_ENTREGA_ATRASADA_WARNING}`,
      });
    } else {
      const fechaDefault = discrepancias.find(
        (item) =>
          item.fieldKey === "fechaEntrega" && item.db === "Leída del correo",
      );
      if (fechaDefault && warnFields.has("fechaEntrega")) {
        avisos.push({
          ...fechaDefault,
          ia: isFechaEntregaIsoValida(fechaEntrega)
            ? `${formatCapturaFecha(fechaEntrega)} · ${FECHA_ENTREGA_DEFAULT_WARNING}`
            : fechaDefault.ia,
        });
      }
    }

    // REQ-151: aviso de posible duplicado (OCC / cliente+día de creación).
    const occTokens = [
      ordenCompraHotel,
      ...ordenesTrabajoForm.map((h) => h.numeroPedido ?? ""),
    ].filter(Boolean);
    if (occTokens.length > 0 || compradorLabel.trim()) {
      const hits = findDuplicadosAgainstDraft({
        draft: {
          occTokens,
          comprador: compradorLabel,
          // Mismo criterio que el listado (`created_at`), no fecha de entrega.
          fecha: new Date().toISOString(),
          idOrdenVentaExcluir: editingId || null,
        },
        existentes: operadorRowsForDuplicado.map((row) => ({
          idOrdenVenta: row.idOrdenVenta,
          codigo: row.venta,
          occTodas: row.occTodas,
          comprador: row.comprador,
          fecha: row.fecha,
          estado: row.estado,
        })),
      });
      if (hits.length > 0) {
        avisos.push({
          campo: "Posible duplicado",
          fieldKey: "potencialDuplicado",
          db: "Revisar antes de confirmar",
          ia: `Puede ser la misma OV que ${hits
            .map((h) => h.codigo)
            .slice(0, 4)
            .join(", ")} (Mateo aún aprende).`,
        });
      }
    }

    // REQ-279: total OV ≠ total declarado en la solicitud.
    const totalOv =
      typeof totalOvCompleta === "number" && totalOvCompleta > 0
        ? totalOvCompleta
        : typeof totalVenta === "number"
          ? totalVenta
          : 0;
    const avisoTotal = buildAvisoTotalSolicitudVsOv({
      totalOv,
      totalSolicitud: resolveTotalSolicitudParaAviso({
        totalSolicitudDetectado,
        origenTexto,
      }),
    });
    if (avisoTotal) avisos.push(avisoTotal);

    return avisos;
  }, [
    compradorLabel,
    discrepancias,
    editingId,
    fechaEntrega,
    fechaEntregaAtrasada,
    operadorRowsForDuplicado,
    ordenCompraHotel,
    ordenesTrabajoForm,
    origenTexto,
    totalSolicitudDetectado,
    totalOvCompleta,
    totalVenta,
    warnFields,
  ]);

  const avisoPotencialDuplicado = useMemo(
    () =>
      avisosValidacion.find((item) => item.fieldKey === "potencialDuplicado") ??
      null,
    [avisosValidacion],
  );

  /** Avisos de catálogo/fecha (sin Dup?): el diálogo de discrepancias Mateo. */
  const avisosCatalogoValidacion = useMemo(
    () =>
      avisosValidacion.filter(
        (item) => item.fieldKey !== "potencialDuplicado",
      ),
    [avisosValidacion],
  );
  return { avisosValidacion, avisoPotencialDuplicado, avisosCatalogoValidacion };
}
