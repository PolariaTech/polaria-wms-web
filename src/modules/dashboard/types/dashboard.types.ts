export type DashboardWidgetId =
  | "ov-pendientes"
  | "sol-compra"
  | "alertas-cuenta"
  | "stock-resumido"
  | "tareas-cola"
  | "alertas-bodega"
  | "tareas-asignadas"
  | "accesos-picking"
  | "cola-procesamiento"
  | "guias-transporte";

export type DashboardWidgetStatus = "loading" | "empty" | "error" | "ready";

export interface DashboardWidgetState {
  status: DashboardWidgetStatus;
  value?: number;
  message?: string;
}

export interface DashboardQueryContext {
  codigoCuenta: string | null;
  idBodega: string | null;
  idUsuario: string | null;
}

export interface DashboardMetricResult {
  ok: true;
  count: number;
}

export interface DashboardMetricError {
  ok: false;
  message: string;
}

export type DashboardMetricResponse = DashboardMetricResult | DashboardMetricError;
