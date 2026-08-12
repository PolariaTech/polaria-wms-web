import {
  resolveOrdenCompraCodigo,
  resolveProductoNombre,
} from "@/modules/warehouses/estado-bodega/utils/estado-bodega-slot-content";
import { parseCatalogoMetadatos } from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import { listWarehouseState } from "@/modules/inventory";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import {
  listBodegasExternasVinculadasAdmin,
  type BodegaExternaVinculadaRow,
} from "@/modules/admin-panel/bodega-externa/services/bodegas-externas-admin.service";
import {
  listBodegasInternasVinculadasAdmin,
  type BodegaInternaVinculadaRow,
} from "@/modules/admin-panel/bodega-interna/services/bodegas-internas-admin.service";
import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { usaInventarioMitSchema } from "../constants/mit-inventario-fridem";
import type { InventarioMercanciaEtapaId } from "./inventario-mercancia-report.service";

const TEMP_ESTABLE_MAX_C = 5;
const INVENTARIO_LISTADO_LIMIT = 500;

interface MitInventarioDbRow {
  id_inventario: string;
  rd: string;
  renglon: number;
  fecha_ingreso: string | null;
  descripcion: string | null;
  marca: string | null;
  embalaje: string | null;
  lote: string | null;
  caducidad: string | null;
  peso_unitario: string | number | null;
  piezas: number | null;
  kilosactual: string | number | null;
}

export interface InventarioMercanciaBodegaOption {
  idBodega: string;
  nombre: string;
  codigo: string;
  tipo: "interna" | "externa";
}

export interface InventarioMercanciaFila {
  key: string;
  rd: string | null;
  renglon: number;
  lote: string | null;
  descripcion: string;
  marca: string | null;
  embalaje: string | null;
  pesoUnitario: number | null;
  piezas: number | null;
  kilosActual: number | null;
  caducidad: string | null;
  fechaIngreso: string | null;
  llaveUnica: string | null;
  estadoTexto: string;
  esAlerta: boolean;
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseCantidad(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatFechaCorta(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-CO");
}

function estadoDesdeTemperatura(
  temperatura: string | number | null | undefined,
): { texto: string; esAlerta: boolean } {
  const parsed = parseCantidad(temperatura);
  if (parsed === null) {
    return { texto: "Sin dato térmico", esAlerta: false };
  }
  if (parsed > TEMP_ESTABLE_MAX_C) {
    return { texto: "Alta temperatura", esAlerta: true };
  }
  return { texto: "Temperatura estable", esAlerta: false };
}

function mapWarehouseStateToFila(
  row: WarehouseStateRow,
  renglon: number,
): InventarioMercanciaFila {
  const producto = unwrapOne(row.producto);
  const meta = parseCatalogoMetadatos(producto?.metadatos_catalogo);
  const lote = unwrapOne(row.lote);
  const kilos = parseCantidad(row.cantidad);
  const gramosPorUnidad = meta.gramosPorUnidad
    ? Number.parseFloat(meta.gramosPorUnidad)
    : NaN;
  const pesoUnitario = Number.isFinite(gramosPorUnidad)
    ? gramosPorUnidad / 1000
    : null;
  const estado = estadoDesdeTemperatura(row.temperatura);

  return {
    key: row.id_warehouse_state,
    rd: resolveOrdenCompraCodigo(row),
    renglon,
    lote: lote?.codigo_lote?.trim() || null,
    descripcion: resolveProductoNombre(row) ?? "Sin nombre",
    marca: meta.proveedor?.trim() || null,
    embalaje: meta.tipo?.trim() || meta.categoria?.trim() || null,
    pesoUnitario,
    piezas: null,
    kilosActual: kilos,
    caducidad: null,
    fechaIngreso: formatFechaCorta(row.updated_at),
    llaveUnica: row.id_warehouse_state,
    estadoTexto: estado.texto,
    esAlerta: estado.esAlerta,
  };
}

function mapMitInventarioToFila(row: MitInventarioDbRow): InventarioMercanciaFila {
  return {
    key: row.id_inventario,
    rd: row.rd?.trim() || null,
    renglon: row.renglon,
    lote: row.lote?.trim() || null,
    descripcion: row.descripcion?.trim() || "Sin nombre",
    marca: row.marca?.trim() || null,
    embalaje: row.embalaje?.trim() || null,
    pesoUnitario: parseCantidad(row.peso_unitario),
    piezas: row.piezas,
    kilosActual: parseCantidad(row.kilosactual),
    caducidad: row.caducidad?.trim() || null,
    fechaIngreso: formatFechaCorta(row.fecha_ingreso),
    llaveUnica: row.id_inventario,
    estadoTexto: "En bodega",
    esAlerta: false,
  };
}

/** Inventario Fridem desde schema `mit` (cuenta Mit 02808). */
async function listInventarioMitFilas(): Promise<InventarioMercanciaFila[]> {
  const rows = await runDomainQuery<MitInventarioDbRow[]>((client) => {
    const query = client
      .schema("mit")
      .from("inventario")
      .select(
        "id_inventario,rd,renglon,fecha_ingreso,descripcion,marca,embalaje,lote,caducidad,peso_unitario,piezas,kilosactual",
      )
      .order("fecha_ingreso", { ascending: true, nullsFirst: false })
      .order("rd", { ascending: true })
      .order("renglon", { ascending: true })
      .limit(INVENTARIO_LISTADO_LIMIT);

    return query as unknown as Promise<{
      data: MitInventarioDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows
    .filter((row) => (parseCantidad(row.kilosactual) ?? 0) > 0)
    .map(mapMitInventarioToFila);
}

export function tipoBodegaParaEtapa(
  etapaId: InventarioMercanciaEtapaId,
): "interna" | "externa" | "ambas" {
  if (etapaId === "bodega_interna") return "interna";
  if (etapaId === "bodega_externa") return "externa";
  return "ambas";
}

export function tituloListadoParaEtapa(
  etapaId: InventarioMercanciaEtapaId,
): string {
  switch (etapaId) {
    case "proveedor":
      return "Elegí una bodega para ver el inventario (proveedor)";
    case "transporte":
      return "Elegí una bodega para ver el inventario (transporte)";
    case "bodega_interna":
      return "Elegí una bodega interna";
    case "bodega_externa":
      return "Elegí una bodega externa";
    case "ventas":
      return "Elegí una bodega para ver el inventario (ventas)";
    default:
      return "Elegí una bodega";
  }
}

/** Bodegas vinculadas a la cuenta, filtradas según la etapa del flujo. */
export async function listBodegasParaInventarioEtapa(params: {
  codigoCuenta: string;
  etapaId: InventarioMercanciaEtapaId;
}): Promise<InventarioMercanciaBodegaOption[]> {
  const tipo = tipoBodegaParaEtapa(params.etapaId);
  const [internas, externas] = await Promise.all([
    tipo === "externa"
      ? Promise.resolve([] as BodegaInternaVinculadaRow[])
      : listBodegasInternasVinculadasAdmin({
          codigoCuenta: params.codigoCuenta,
        }),
    tipo === "interna"
      ? Promise.resolve([] as BodegaExternaVinculadaRow[])
      : listBodegasExternasVinculadasAdmin({
          codigoCuenta: params.codigoCuenta,
        }),
  ]);

  return [
    ...internas.map((b) => ({
      idBodega: b.idBodega,
      nombre: b.nombre,
      codigo: b.codigo,
      tipo: "interna" as const,
    })),
    ...externas.map((b) => ({
      idBodega: b.idBodega,
      nombre: b.nombre,
      codigo: b.codigo,
      tipo: "externa" as const,
    })),
  ];
}

/** Filas de inventario en mapa para la bodega seleccionada (columnas estilo frio). */
export async function listInventarioMercanciaFilas(params: {
  codigoCuenta: string;
  idBodega: string;
  bodegaNombre?: string | null;
}): Promise<InventarioMercanciaFila[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);

  if (usaInventarioMitSchema(codigoCuenta, params.bodegaNombre)) {
    return listInventarioMitFilas();
  }

  const rows = await listWarehouseState({
    idBodega: params.idBodega,
    codigoCuenta,
    limit: INVENTARIO_LISTADO_LIMIT,
  });

  return rows
    .filter((row) => {
      const kg = parseCantidad(row.cantidad) ?? 0;
      return kg > 0;
    })
    .map((row, index) => mapWarehouseStateToFila(row, index + 1));
}
