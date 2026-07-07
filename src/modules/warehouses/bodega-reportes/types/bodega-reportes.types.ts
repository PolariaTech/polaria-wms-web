export type BodegaReporteCategoriaId =
  | "ingresos"
  | "salidas"
  | "movimientos"
  | "despachados"
  | "alertas"
  | "merma";

export interface BodegaReporteCategoriaMetric {
  id: BodegaReporteCategoriaId;
  total: number;
}

export interface BodegaReportesResumen {
  ingresos: number;
  salidas: number;
  movimientos: number;
  despachados: number;
  alertas: number;
  mermaKg: number;
}

export interface BodegaReportesChartPoint {
  id: Exclude<BodegaReporteCategoriaId, "merma">;
  label: string;
  value: number;
}

export interface BodegaReportesData {
  resumen: BodegaReportesResumen;
  barChart: BodegaReportesChartPoint[];
  donutChart: BodegaReporteCategoriaMetric[];
}
