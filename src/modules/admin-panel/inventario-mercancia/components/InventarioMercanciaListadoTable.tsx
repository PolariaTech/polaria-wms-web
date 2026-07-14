"use client";

import { useMemo } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import type { PolariaDataTableColumn } from "@/components/shared/table/PolariaDataTable";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { cn } from "@/lib/utils/cn";
import type { InventarioMercanciaFila } from "../services/inventario-mercancia-listado.service";

function dash(value: string | null | undefined): string {
  if (value == null) return "—";
  const trimmed = value.trim();
  return trimmed === "" ? "—" : trimmed;
}

interface InventarioMercanciaListadoTableProps {
  warehouseName: string;
  rows: InventarioMercanciaFila[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function InventarioMercanciaListadoTable({
  warehouseName,
  rows,
  isLoading,
  error,
  onRefresh,
}: InventarioMercanciaListadoTableProps) {
  const columns = useMemo(
    (): PolariaDataTableColumn<InventarioMercanciaFila>[] => [
      {
        id: "rd",
        header: "RD",
        cell: (row) => dash(row.rd),
        cellClassName: "whitespace-nowrap",
      },
      {
        id: "renglon",
        header: "Renglón",
        cell: (row) => row.renglon,
        cellClassName: "whitespace-nowrap tabular-nums",
      },
      {
        id: "lote",
        header: "Lote",
        cell: (row) => (
          <span className="font-semibold text-polaria-w">{dash(row.lote)}</span>
        ),
        cellClassName: "whitespace-nowrap",
      },
      {
        id: "descripcion",
        header: "Descripción",
        cell: (row) => dash(row.descripcion),
        cellClassName: "max-w-[14rem] truncate",
      },
      {
        id: "marca",
        header: "Marca",
        cell: (row) => dash(row.marca),
        cellClassName: "whitespace-nowrap",
      },
      {
        id: "embalaje",
        header: "Embalaje",
        cell: (row) => dash(row.embalaje),
        cellClassName: "whitespace-nowrap",
      },
      {
        id: "peso-unit",
        header: "Peso Unit.",
        cell: (row) =>
          row.pesoUnitario !== null ? `${formatKgEs(row.pesoUnitario)} Kg` : "—",
        cellClassName: "whitespace-nowrap text-right tabular-nums",
        headerClassName: "text-right",
      },
      {
        id: "piezas",
        header: "Piezas",
        cell: (row) =>
          row.piezas !== null ? formatKgEs(row.piezas) : "—",
        cellClassName: "whitespace-nowrap text-right tabular-nums",
        headerClassName: "text-right",
      },
      {
        id: "kilos",
        header: "Kilos actual",
        cell: (row) =>
          row.kilosActual !== null ? (
            <span className="font-semibold text-polaria-w">
              {formatKgEs(row.kilosActual)} Kg
            </span>
          ) : (
            "—"
          ),
        cellClassName: "whitespace-nowrap text-right tabular-nums",
        headerClassName: "text-right",
      },
      {
        id: "caducidad",
        header: "Caducidad",
        cell: (row) => dash(row.caducidad),
        cellClassName: "whitespace-nowrap",
      },
      {
        id: "fecha-ingreso",
        header: "Fecha ingreso",
        cell: (row) => dash(row.fechaIngreso),
        cellClassName: "whitespace-nowrap",
      },
      {
        id: "llave",
        header: "Llave única",
        cell: (row) => dash(row.llaveUnica),
        cellClassName: "max-w-[10rem] truncate whitespace-nowrap",
      },
      {
        id: "estado",
        header: "Estado",
        cell: (row) => (
          <span className="inline-flex items-center justify-center gap-2">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                row.esAlerta ? "bg-polaria-danger" : "bg-polaria-teal",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "polaria-text-body-sm",
                row.esAlerta ? "font-semibold text-polaria-danger" : "text-polaria-w",
              )}
            >
              {row.estadoTexto}
            </span>
          </span>
        ),
        cellClassName: "whitespace-nowrap text-center",
        headerClassName: "text-center",
      },
    ],
    [],
  );

  return (
    <PolariaDataTable
      title="Inventario en bodega"
      subtitle={warehouseName}
      isLoading={isLoading}
      error={error}
      rows={rows}
      columns={columns}
      getRowKey={(row) => row.key}
      emptyMessage="No hay posiciones ocupadas en esta bodega."
      onRefresh={onRefresh}
      tableClassName="min-w-[64rem]"
    />
  );
}
