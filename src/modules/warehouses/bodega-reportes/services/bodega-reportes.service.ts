import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { BODEGA_REPORTES_BAR_LABELS } from "../constants/bodega-reportes-config";
import type {
  BodegaReporteCategoriaMetric,
  BodegaReportesChartPoint,
  BodegaReportesData,
  BodegaReportesResumen,
} from "../types/bodega-reportes.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CountQuery = any;

interface ReportesQueryContext {
  codigoCuenta: string | null;
  idBodega: string | null;
}

async function countRows(
  table: string,
  applyFilters: (query: CountQuery) => CountQuery,
): Promise<number> {
  try {
    const supabase = createSupabaseBrowserClient();
    const base = supabase.from(table).select("*", { count: "exact", head: true });
    const { count, error } = await applyFilters(base);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function sumMermaKg(idBodega: string): Promise<number> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("solicitud_procesamiento")
      .select("kilos_merma")
      .eq("id_bodega", idBodega)
      .eq("estado", "cerrada");

    if (error || !data) return 0;

    return data.reduce((total, row) => {
      const value = Number(row.kilos_merma ?? 0);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  } catch {
    return 0;
  }
}

function buildChartData(resumen: BodegaReportesResumen): {
  barChart: BodegaReportesChartPoint[];
  donutChart: BodegaReporteCategoriaMetric[];
} {
  const barChart: BodegaReportesChartPoint[] = (
    Object.keys(BODEGA_REPORTES_BAR_LABELS) as Array<
      keyof typeof BODEGA_REPORTES_BAR_LABELS
    >
  ).map((id) => ({
    id,
    label: BODEGA_REPORTES_BAR_LABELS[id],
    value: resumen[id],
  }));

  const donutChart: BodegaReporteCategoriaMetric[] = [
    { id: "ingresos", total: resumen.ingresos },
    { id: "salidas", total: resumen.salidas },
    { id: "movimientos", total: resumen.movimientos },
    { id: "despachados", total: resumen.despachados },
    { id: "alertas", total: resumen.alertas },
    { id: "merma", total: resumen.mermaKg },
  ].filter((item) => item.total > 0);

  return { barChart, donutChart };
}

const EMPTY_RESUMEN: BodegaReportesResumen = {
  ingresos: 0,
  salidas: 0,
  movimientos: 0,
  despachados: 0,
  alertas: 0,
  mermaKg: 0,
};

export async function getBodegaReportesData(
  context: ReportesQueryContext,
): Promise<BodegaReportesData> {
  const { codigoCuenta, idBodega } = context;

  if (!codigoCuenta || !idBodega) {
    const charts = buildChartData(EMPTY_RESUMEN);
    return { resumen: EMPTY_RESUMEN, ...charts };
  }

  const [
    ingresos,
    salidas,
    movimientos,
    despachados,
    alertas,
    mermaKg,
  ] = await Promise.all([
    countRows("recepcion_compra", (query) =>
      query.eq("codigo_cuenta", codigoCuenta).eq("id_bodega", idBodega),
    ),
    countRows("orden_venta", (query) =>
      query
        .eq("codigo_cuenta", codigoCuenta)
        .in("estado", ["despachada", "cerrada"]),
    ),
    countRows("auditoria_operacion", (query) =>
      query
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_bodega", idBodega)
        .eq("accion", "movimiento_inventario"),
    ),
    countRows("guia_envio", (query) =>
      query.eq("codigo_cuenta", codigoCuenta).eq("estado", "entregada"),
    ),
    countRows("alerta_operativa", (query) =>
      query.eq("codigo_cuenta", codigoCuenta).eq("id_bodega", idBodega),
    ),
    sumMermaKg(idBodega),
  ]);

  const resumen: BodegaReportesResumen = {
    ingresos,
    salidas,
    movimientos,
    despachados,
    alertas,
    mermaKg: Math.round(mermaKg * 10) / 10,
  };

  const charts = buildChartData(resumen);
  return { resumen, ...charts };
}

export function createEmptyBodegaReportesData(): BodegaReportesData {
  const charts = buildChartData(EMPTY_RESUMEN);
  return { resumen: EMPTY_RESUMEN, ...charts };
}
