import type { EstadoOrdenVenta } from "../types/sales.types";

export const OV_SLA_MINUTOS_DEFAULT = 60;
export const OV_ALERTA_MINUTOS_DEFAULT = 45;

export type OvSlaStatus = "en_tiempo" | "atrasada" | "cerrada";
export type OvAlertaStatus = "ok" | "en_riesgo" | "atrasada" | "cerrada";

export interface OvSlaConfig {
  slaMinutos: number;
  alertaMinutos: number;
}

export interface OvSlaComputed {
  minutosEnEstado: number;
  slaStatus: OvSlaStatus;
  alertaStatus: OvAlertaStatus;
}

export function normalizeOvSlaConfig(
  slaMinutos?: number | null,
  alertaMinutos?: number | null,
): OvSlaConfig {
  const sla = Math.max(
    1,
    Math.trunc(Number.isFinite(slaMinutos) ? Number(slaMinutos) : OV_SLA_MINUTOS_DEFAULT),
  );
  let alerta = Math.max(
    1,
    Math.trunc(
      Number.isFinite(alertaMinutos) ? Number(alertaMinutos) : OV_ALERTA_MINUTOS_DEFAULT,
    ),
  );
  if (alerta > sla) alerta = sla;
  return { slaMinutos: sla, alertaMinutos: alerta };
}

export function minutesSince(iso: string | null | undefined, nowMs = Date.now()): number {
  if (!iso) return 0;
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor((nowMs - parsed) / 60_000));
}

export function computeOvSla(
  estado: EstadoOrdenVenta,
  estadoDesde: string | null | undefined,
  config: OvSlaConfig,
  nowMs = Date.now(),
): OvSlaComputed {
  const minutosEnEstado = minutesSince(estadoDesde, nowMs);

  if (estado === "despachada" || estado === "facturada" || estado === "cancelada") {
    return {
      minutosEnEstado,
      slaStatus: "cerrada",
      alertaStatus: "cerrada",
    };
  }

  if (minutosEnEstado >= config.slaMinutos) {
    return {
      minutosEnEstado,
      slaStatus: "atrasada",
      alertaStatus: "atrasada",
    };
  }

  if (minutosEnEstado >= config.alertaMinutos) {
    return {
      minutosEnEstado,
      slaStatus: "en_tiempo",
      alertaStatus: "en_riesgo",
    };
  }

  return {
    minutosEnEstado,
    slaStatus: "en_tiempo",
    alertaStatus: "ok",
  };
}

/** "38 min" | "1 h 08 min" — tiempo en etapa para la columna SLA. */
export function formatOvElapsed(minutos: number): string {
  const m = Math.max(0, Math.trunc(minutos));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${h} h`;
  return `${h} h ${String(rem).padStart(2, "0")} min`;
}

export function labelOvSlaStatus(status: OvSlaStatus): string {
  switch (status) {
    case "atrasada":
      return "Atrasada";
    case "cerrada":
      return "Completada";
    default:
      return "En tiempo";
  }
}

export function labelOvAlertaStatus(status: OvAlertaStatus): string {
  switch (status) {
    case "atrasada":
      return "Atrasada";
    case "en_riesgo":
      return "En riesgo";
    case "cerrada":
      return "—";
    default:
      return "Ok";
  }
}

/**
 * Color del punto SLA (usa alerta: green / amber / red).
 * En riesgo pinta naranja aunque el SLA duro aún no se rompió.
 */
export function slaDotTone(
  alertaStatus: OvAlertaStatus,
): "ok" | "en_riesgo" | "atrasada" | "cerrada" {
  if (alertaStatus === "cerrada") return "cerrada";
  if (alertaStatus === "atrasada") return "atrasada";
  if (alertaStatus === "en_riesgo") return "en_riesgo";
  return "ok";
}

/**
 * Texto del tooltip del punto SLA en la tabla OV.
 * Rojo: «Sin avanzar hace X · límite Y» (como en diseño).
 */
export function tooltipOvAlertaDot(input: {
  alertaStatus: OvAlertaStatus;
  minutosEnEstado: number;
  slaMinutos?: number | null;
  alertaMinutos?: number | null;
}): string {
  const config = normalizeOvSlaConfig(input.slaMinutos, input.alertaMinutos);
  const elapsed = formatOvElapsed(input.minutosEnEstado);
  const limiteSla = formatOvElapsed(config.slaMinutos);
  const limiteAlerta = formatOvElapsed(config.alertaMinutos);

  switch (input.alertaStatus) {
    case "atrasada":
      return `Sin avanzar hace ${elapsed} · límite ${limiteSla}`;
    case "en_riesgo":
      return `En riesgo · sin avanzar hace ${elapsed} · alerta a ${limiteAlerta}`;
    case "cerrada":
      return "Completada · sin seguimiento de tiempo";
    default:
      return `En tiempo · ${elapsed} en esta etapa · límite ${limiteSla}`;
  }
}

/** Nº en el badge de alertas: 1 umbral cruzado → 1; SLA+alerta → 2. */
export function ovAlertaCount(status: OvAlertaStatus): number {
  if (status === "atrasada") return 2;
  if (status === "en_riesgo") return 1;
  return 0;
}
