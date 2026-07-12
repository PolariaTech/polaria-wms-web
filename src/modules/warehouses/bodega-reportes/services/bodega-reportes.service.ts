import { getBodegaReportesApi, listOrdenesTrabajoApi } from "@/modules/operations";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { BODEGA_REPORTES_BAR_LABELS } from "../constants/bodega-reportes-config";
import { syncDemoraAlertasHistorial } from "@/modules/warehouses/estado-bodega/services/estado-bodega-demora-alerta-sync.service";
import { countOrdenesTrabajoSalidaEjecutadas } from "../utils/bodega-reportes-salidas";
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

async function countSalidasOperativasCompletadas(
  codigoCuenta: string,
  idBodega: string,
): Promise<number> {
  try {
    const ordenes = await listOrdenesTrabajoApi({ codigoCuenta, idBodega });
    const fromApi = countOrdenesTrabajoSalidaEjecutadas(ordenes);
    if (fromApi > 0) return fromApi;
  } catch {
    // fallback Supabase abajo
  }

  return countRows("orden_trabajo", (query) =>
    query
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_bodega", idBodega)
      .not("id_ubicacion_destino", "is", null)
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

async function sumMermaKg(idBodega: string): Promise<number> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("solicitud_procesamiento")
      .select("kilos_merma")
      .eq("id_bodega", idBodega)
      .eq("estado", "terminada");

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

  if (!codigoCuenta || !idBodega) {
    const charts = buildChartData(EMPTY_RESUMEN);
    return { resumen: EMPTY_RESUMEN, ...charts };
  }

  const syncResult = await syncDemoraAlertasHistorial({ codigoCuenta, idBodega }).catch(
    () => ({
      persisted: 0,
      alertasTotal: 0,
    }),
  );

  try {
    const [apiResumen, salidasOperativas] = await Promise.all([
      getBodegaReportesApi({ codigoCuenta, idBodega }),
      countSalidasOperativasCompletadas(codigoCuenta, idBodega),
    ]);
    const resumen: BodegaReportesResumen = {
      ingresos: apiResumen.ingresos,
      salidas: Math.max(apiResumen.salidas, salidasOperativas),
      movimientos: apiResumen.movimientos,
      despachados: apiResumen.despachados,
      alertas: Math.max(apiResumen.alertas, syncResult.alertasTotal),
      mermaKg: apiResumen.mermaKg,
    };
    const charts = buildChartData(resumen);
    return { resumen, ...charts };
  } catch {
    // fallback Supabase abajo
  }

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
      query.eq("codigo_cuenta", codigoCuenta).eq("id_bodega", idBodega),
    ),
    countRows("orden_venta", (query) =>
      query
        .eq("codigo_cuenta", codigoCuenta)
        .in("estado", ["despachada", "cerrada"]),
    ),
    countSalidasOperativasCompletadas(codigoCuenta, idBodega),
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
    salidas: Math.max(salidasOv, salidasOt),
    movimientos,
    despachados,
    alertas: Math.max(alertas, syncResult.alertasTotal),
    mermaKg: Math.round(mermaKg * 10) / 10,
  };

  const charts = buildChartData(resumen);
  return { resumen, ...charts };
}

export function createEmptyBodegaReportesData(): BodegaReportesData {
  const charts = buildChartData(EMPTY_RESUMEN);
  return { resumen: EMPTY_RESUMEN, ...charts };
}
