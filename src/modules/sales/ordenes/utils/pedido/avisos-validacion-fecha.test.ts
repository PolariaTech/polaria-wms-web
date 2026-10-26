import { describe, expect, it } from "vitest";
import { formatCapturaFecha } from "./build-orden-venta-captura-observaciones";
import {
  FECHA_ENTREGA_ATRASADA_WARNING,
  isFechaEntregaAtrasada,
  isFechaEntregaIsoValida,
} from "./pedido-form-validation";
import type { CampoDiscrepancia } from "./map-pedido-extraido-to-form";

/**
 * Réplica de la lógica REQ-118 en CreateModal (fecha viva vs snapshot Mateo).
 */
function buildAvisosFecha(params: {
  discrepancias: CampoDiscrepancia[];
  fechaEntrega: string;
  todayIso: string;
  warnFields: Set<string>;
}): CampoDiscrepancia[] {
  const fechaEntregaAtrasada = isFechaEntregaAtrasada(
    params.fechaEntrega,
    params.todayIso,
  );
  const sinFecha = params.discrepancias.filter(
    (item) => item.fieldKey !== "fechaEntrega",
  );
  const avisos: CampoDiscrepancia[] = [...sinFecha];
  if (fechaEntregaAtrasada && isFechaEntregaIsoValida(params.fechaEntrega)) {
    avisos.push({
      campo: "Fecha de entrega",
      fieldKey: "fechaEntrega",
      db: "Hoy o posterior",
      ia: `${formatCapturaFecha(params.fechaEntrega)} · ${FECHA_ENTREGA_ATRASADA_WARNING}`,
    });
    return avisos;
  }
  const fechaDefault = params.discrepancias.find(
    (item) =>
      item.fieldKey === "fechaEntrega" && item.db === "Leída del correo",
  );
  if (fechaDefault && params.warnFields.has("fechaEntrega")) {
    avisos.push({
      ...fechaDefault,
      ia: isFechaEntregaIsoValida(params.fechaEntrega)
        ? `${formatCapturaFecha(params.fechaEntrega)} · Fecha por defecto (no leída del correo)`
        : fechaDefault.ia,
    });
  }
  return avisos;
}

describe("avisos validación fecha (REQ-118)", () => {
  it("no muestra alerta de atrasada si el usuario ya puso hoy o posterior", () => {
    const stale: CampoDiscrepancia[] = [
      {
        campo: "Fecha de entrega",
        fieldKey: "fechaEntrega",
        db: "Hoy o posterior",
        ia: `22/10/2026 · ${FECHA_ENTREGA_ATRASADA_WARNING}`,
      },
    ];
    const avisos = buildAvisosFecha({
      discrepancias: stale,
      fechaEntrega: "2026-10-23",
      todayIso: "2026-10-23",
      warnFields: new Set(),
    });
    expect(avisos.some((a) => a.fieldKey === "fechaEntrega")).toBe(false);
  });

  it("muestra la fecha actual del form si sigue atrasada (no el 22 viejo)", () => {
    const stale: CampoDiscrepancia[] = [
      {
        campo: "Fecha de entrega",
        fieldKey: "fechaEntrega",
        db: "Hoy o posterior",
        ia: `21/10/2026 · ${FECHA_ENTREGA_ATRASADA_WARNING}`,
      },
    ];
    const avisos = buildAvisosFecha({
      discrepancias: stale,
      fechaEntrega: "2026-10-22",
      todayIso: "2026-10-23",
      warnFields: new Set(["fechaEntrega"]),
    });
    const fecha = avisos.find((a) => a.fieldKey === "fechaEntrega");
    expect(fecha?.ia).toContain("22/10/2026");
    expect(fecha?.ia).not.toContain("21/10/2026");
  });
});
