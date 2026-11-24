"use client";

import type { ReactNode } from "react";
import { PolariaDataTable, type PolariaDataTableColumn } from "@/components/shared/table/PolariaDataTable";
import { TABLA_COMPACTA_PANTALLA_BAJA } from "@/components/shared/table/tabla-compacta";
import { cn } from "@/lib/utils/cn";
import { ESTADO_ORDEN_VENTA_LABELS } from "../../../shared/constants/sales-status";
import type {
  EstadoOrdenVenta,
  OrdenVentaOperadorRow,
} from "../../../shared/types/sales.types";
import { ORDENES_VENTA_TABLE_MIN_WIDTH_CLASS } from "../../constants/ordenes-venta-table-layout";
import type { ConteoPorEstado } from "./ov-impresion-feedback";
import { OV_LISTADO_DATATABLE_CHROME_CLASS } from "./ov-listado-chrome";
import { OvEstadoFiltroBar } from "./OvEstadoFiltroBar";

export interface OperadorOrdenesVentaTablaProps {
  estadoFiltro: EstadoOrdenVenta | null;
  onEstadoFiltroChange: (estado: EstadoOrdenVenta | null) => void;
  totalDelDia: number;
  countsByEstado: ConteoPorEstado;
  isLoading: boolean;
  error: string | null;
  codigoCuenta: string | null;
  rows: OrdenVentaOperadorRow[];
  columns: PolariaDataTableColumn<OrdenVentaOperadorRow>[];
  fechaFiltroDia: string | null;
  inspect: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNuevaVenta: () => void;
  onRowClick: (row: OrdenVentaOperadorRow) => void;
}

/** Mensaje de la tabla vacía según el filtro de estado o de día activos. */
export function mensajeListadoVacio(
  estadoFiltro: EstadoOrdenVenta | null,
  fechaFiltroDia: string | null,
): string {
  if (estadoFiltro) {
    return `Sin órdenes en estado «${ESTADO_ORDEN_VENTA_LABELS[estadoFiltro]}».`;
  }
  return fechaFiltroDia
    ? "Sin órdenes con entrega hoy o mañana."
    : "Sin órdenes de venta registradas.";
}

/** Barra de filtro por estado + tabla del listado de órdenes de venta del operador. */
export function OperadorOrdenesVentaTabla({
  estadoFiltro,
  onEstadoFiltroChange,
  totalDelDia,
  countsByEstado,
  isLoading,
  error,
  codigoCuenta,
  rows,
  columns,
  fechaFiltroDia,
  inspect,
  isRefreshing,
  onRefresh,
  onNuevaVenta,
  onRowClick,
}: OperadorOrdenesVentaTablaProps): ReactNode {
  return (
    <>
      <OvEstadoFiltroBar
        estadoFiltro={estadoFiltro}
        onChange={onEstadoFiltroChange}
        totalDelDia={totalDelDia}
        countsByEstado={countsByEstado}
      />

      <PolariaDataTable
        title=""
        isLoading={isLoading}
        error={error ?? (!codigoCuenta ? "No se encontró la cuenta activa." : null)}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idOrdenVenta}
        emptyMessage={mensajeListadoVacio(estadoFiltro, fechaFiltroDia)}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        primaryAction={
          inspect ? undefined : { label: "Nueva venta", onClick: onNuevaVenta }
        }
        onRowClick={onRowClick}
        getRowAriaLabel={(row) =>
          row.estado === "por_confirmar"
            ? `Revisar pedido ${row.venta} con Cypher`
            : `Ver detalle de venta ${row.venta}`
        }
        className={cn(OV_LISTADO_DATATABLE_CHROME_CLASS, TABLA_COMPACTA_PANTALLA_BAJA)}
        tableClassName={ORDENES_VENTA_TABLE_MIN_WIDTH_CLASS}
      />
    </>
  );
}
