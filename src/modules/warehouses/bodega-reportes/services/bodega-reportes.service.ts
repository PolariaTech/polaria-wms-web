import { getBodegaReportesApi, listOrdenesTrabajoApi } from "@/modules/operations";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { BODEGA_REPORTES_BAR_LABELS } from "../constants/bodega-reportes-config";
import { syncDemoraAlertasHistorial } from "@/modules/warehouses/estado-bodega/services/estado-bodega-demora-alerta-sync.service";
import { countOrdenesTrabajoSalidaEjecutadas } from "../utils/bodega-reportes-salidas";
import { todayIsoDateBogota } from "../utils/bodega-reportes-fecha";
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
  fechaDesde?: string;
  fechaHasta?: string;
}

function resolveFechaParams(context: ReportesQueryContext): {
  fechaDesde: string;
  fechaHasta: string;
} {
  const today = todayIsoDateBogota();
  return {
    fechaDesde: context.fechaDesde?.slice(0, 10) || today,
    fechaHasta: context.fechaHasta?.slice(0, 10) || today,
  };
}

/** Inicio/fin inclusivos del día calendario Bogotá para filtros Supabase. */
function bogotaDayBounds(fechaDesde: string, fechaHasta: string): {
  desdeIso: string;
  hastaIso: string;
} {
  return {
    desdeIso: new Date(`${fechaDesde}T00:00:00.000-05:00`).toISOString(),
    hastaIso: new Date(`${fechaHasta}T23:59:59.999-05:00`).toISOString(),
  };
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

async function countSalidasOperativasCompletadas(
  codigoCuenta: string,
  idBodega: string,
  fechaDesde: string,
  fechaHasta: string,
): Promise<number> {
  const { desdeIso, hastaIso } = bogotaDayBounds(fechaDesde, fechaHasta);

  try {
    const ordenes = await listOrdenesTrabajoApi({ codigoCuenta, idBodega });
    const inRange = ordenes.filter((ot) => {
      const created = ot.createdAt ? new Date(ot.createdAt).getTime() : NaN;
      if (!Number.isFinite(created)) return false;
      return (
        created >= new Date(desdeIso).getTime() &&
        created <= new Date(hastaIso).getTime()
      );
    });
    const fromApi = countOrdenesTrabajoSalidaEjecutadas(inRange);
    if (fromApi > 0) return fromApi;
  } catch {
    // fallback Supabase abajo
  }

  return countRows("orden_trabajo", (query) =>
    query
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_bodega", idBodega)
      .not("id_ubicacion_destino", "is", null)
      .gte("created_at", desdeIso)
      .lte("created_at", hastaIso)
      .in("estado", [
        "completada",
        "completado",
        "ejecutada",
        "ejecutado",
        "cerrada",
        "cerrado",
      ]),
  );
}

async function sumMermaKg(
  idBodega: string,
  fechaDesde: string,
  fechaHasta: string,
): Promise<number> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("registro_merma")
      .select("kilos_merma")
      .eq("id_bodega", idBodega)
      .gte("periodo", fechaDesde)
      .lte("periodo", fechaHasta);

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

  const donutChart: BodegaReporteCategoriaMetric[] = (
    [
      { id: "ingresos" as const, total: resumen.ingresos },
      { id: "salidas" as const, total: resumen.salidas },
      { id: "movimientos" as const, total: resumen.movimientos },
      { id: "despachados" as const, total: resumen.despachados },
      { id: "alertas" as const, total: resumen.alertas },
      { id: "merma" as const, total: resumen.mermaKg },
    ] as BodegaReporteCategoriaMetric[]
  ).filter((item) => item.total > 0);

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
  const { fechaDesde, fechaHasta } = resolveFechaParams(context);

  if (!codigoCuenta || !idBodega) {
    const charts = buildChartData(EMPTY_RESUMEN);
    return { resumen: EMPTY_RESUMEN, ...charts };
  }

  // Sync demoras (side-effect). No infla métricas del rango: la fuente es la API.
  await syncDemoraAlertasHistorial({ codigoCuenta, idBodega }).catch(() => ({
    persisted: 0,
    alertasTotal: 0,
  }));

  try {
    const apiResumen = await getBodegaReportesApi({
      codigoCuenta,
      idBodega,
      fechaDesde,
      fechaHasta,
    });
    const resumen: BodegaReportesResumen = {
      ingresos: apiResumen.ingresos,
      salidas: apiResumen.salidas,
      movimientos: apiResumen.movimientos,
      despachados: apiResumen.despachados,
      alertas: apiResumen.alertas,
      mermaKg: apiResumen.mermaKg,
    };
    const charts = buildChartData(resumen);
    return { resumen, ...charts };
  } catch {
    // fallback Supabase abajo
  }

  const { desdeIso, hastaIso } = bogotaDayBounds(fechaDesde, fechaHasta);

  const [
    ingresos,
    salidasOv,
    salidasOt,
    movimientos,
    despachados,
    alertas,
    mermaKg,
  ] = await Promise.all([
    countRows("recepcion_compra", (query) =>
      query
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_bodega", idBodega)
        .gte("cerrada_at", desdeIso)
        .lte("cerrada_at", hastaIso),
    ),
    countRows("orden_venta", (query) =>
      query
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_bodega", idBodega)
        .in("estado", ["despachada", "cerrada"])
        .gte("updated_at", desdeIso)
        .lte("updated_at", hastaIso),
    ),
    countSalidasOperativasCompletadas(
      codigoCuenta,
      idBodega,
      fechaDesde,
      fechaHasta,
    ),
    countRows("movimiento_inventario", (query) =>
      query
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_bodega", idBodega)
        .eq("tipo_movimiento", "transferencia")
        .gte("created_at", desdeIso)
        .lte("created_at", hastaIso),
    ),
    countRows("guia_envio", (query) =>
      query
        .eq("codigo_cuenta", codigoCuenta)
        .eq("estado", "entregada")
        .gte("updated_at", desdeIso)
        .lte("updated_at", hastaIso),
    ),
    countRows("alerta_operativa", (query) =>
      query
        .eq("codigo_cuenta", codigoCuenta)
        .eq("id_bodega", idBodega)
        .gte("created_at", desdeIso)
        .lte("created_at", hastaIso),
    ),
    sumMermaKg(idBodega, fechaDesde, fechaHasta),
  ]);

  const resumen: BodegaReportesResumen = {
    ingresos,
    salidas: Math.max(salidasOv, salidasOt),
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
