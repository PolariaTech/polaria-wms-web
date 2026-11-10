"use client";

import { Printer } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { useAuthStore } from "@/stores/auth.store";
import {
  formatEstadoOrdenVenta,
  variantEstadoOrdenVenta,
} from "../../../shared/constants/sales-status";
import type {
  EstadoOrdenVenta,
  OrdenVentaOperadorRow,
} from "../../../shared/types/sales.types";
import { ordenVentaTableColumnClass } from "../../constants/ordenes-venta-table-layout";
import { OvAlertaDot } from "../shared/OvAlertaDot";
import { OvEditPresenceBadge } from "../shared/OvEditPresenceBadge";
import { BotonDetalleOrden } from "./BotonDetalleOrden";
import { renderClienteListadoCell } from "./cliente-listado-cell";
import { textoFechaEntregaListado } from "./texto-fecha-entrega-listado";

function renderEstadoBadge(estado: EstadoOrdenVenta) {
  return (
    <PolariaTableBadge variant={variantEstadoOrdenVenta(estado)}>
      {formatEstadoOrdenVenta(estado)}
    </PolariaTableBadge>
  );
}

/** Columnas del listado operador OV (REQ-180: badge de presencia). */
export function buildOperadorOrdenesVentaColumns(params: {
  inspect: boolean;
  cypherId: string | null;
  idsCorreoNoEnviado: Set<string>;
  setDetalleId: Dispatch<SetStateAction<string | null>>;
  setCypherId: Dispatch<SetStateAction<string | null>>;
}) {
  const { inspect, cypherId, idsCorreoNoEnviado, setDetalleId, setCypherId } =
    params;

  return [
    {
      id: "venta",
      header: "OV",
      headerClassName: ordenVentaTableColumnClass("venta", "header"),
      cellClassName: ordenVentaTableColumnClass("venta"),
      cell: (row: OrdenVentaOperadorRow) => (
        <span className="inline-flex items-center gap-2">
          <OvAlertaDot
            alertaStatus={row.alertaStatus}
            minutosEnEstado={row.minutosEnEstado}
            slaMinutos={row.slaMinutos}
            alertaMinutos={row.alertaMinutos}
          />
          <PolariaTableCode>{row.venta}</PolariaTableCode>
          <OvEditPresenceBadge
            editLockedBy={row.editLockedBy}
            editLockedAt={row.editLockedAt}
            editLockedNombre={row.editLockedNombre}
            viewerId={useAuthStore.getState().session?.idUsuario}
          />
          {row.potencialDuplicado ? (
            <span
              className="shrink-0 rounded-md border border-polaria-warning-border bg-polaria-warning-bg px-1.5 py-0.5 polaria-text-caption font-semibold text-polaria-warning"
              title={
                row.potencialDuplicadoDe && row.potencialDuplicadoDe.length > 0
                  ? `Posible duplicado de ${row.potencialDuplicadoDe.join(", ")}`
                  : "Posible OV duplicada (Mateo aún aprende)"
              }
            >
              Dup?
            </span>
          ) : null}
        </span>
      ),
    },
    {
      id: "occ",
      header: "Orden de compra",
      headerClassName: ordenVentaTableColumnClass("occ", "header"),
      cellClassName: ordenVentaTableColumnClass("occ"),
      cell: (row: OrdenVentaOperadorRow) => {
        const title =
          row.occTodas.length > 0 ? row.occTodas.join(", ") : row.occ;
        const tieneMas = row.occTodas.length > 1;
        return (
          <span
            className="inline-flex max-w-[10rem] items-center gap-1"
            title={title}
          >
            <span className="min-w-0 truncate">{row.occ}</span>
            {tieneMas ? (
              <span
                className="shrink-0 font-medium text-polaria-teal"
                aria-label={`${row.occTodas.length - 1} OCC más`}
              >
                +
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      id: "comprador",
      header: "Cliente",
      headerClassName: ordenVentaTableColumnClass("comprador", "header"),
      cellClassName: ordenVentaTableColumnClass("comprador"),
      cell: (row: OrdenVentaOperadorRow) => renderClienteListadoCell(row),
    },
    {
      id: "estado",
      header: "Estado",
      headerClassName: ordenVentaTableColumnClass("estado", "header"),
      cellClassName: ordenVentaTableColumnClass("estado"),
      cell: (row: OrdenVentaOperadorRow) => renderEstadoBadge(row.estado),
    },
    {
      id: "fecha",
      header: "Fecha de entrega",
      headerClassName: ordenVentaTableColumnClass("fecha", "header"),
      cellClassName: ordenVentaTableColumnClass("fecha"),
      cell: (row: OrdenVentaOperadorRow) => textoFechaEntregaListado(row),
    },
    {
      id: "ot",
      header: "Tareas",
      headerClassName: ordenVentaTableColumnClass("ot", "header"),
      cellClassName: ordenVentaTableColumnClass("ot"),
      cell: (row: OrdenVentaOperadorRow) => String(row.ordenesTrabajo),
    },
    ...(inspect
      ? []
      : [
          {
            id: "acciones",
            header: "Acciones",
            headerClassName: ordenVentaTableColumnClass("acciones", "header"),
            cellClassName: ordenVentaTableColumnClass("acciones"),
            cell: (row: OrdenVentaOperadorRow) => {
              const open = cypherId === row.idOrdenVenta;
              return (
                <span
                  className="inline-flex items-center gap-1.5"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <BotonDetalleOrden
                    abierto={open}
                    venta={row.venta}
                    onAlternar={() => {
                      if (row.estado === "cancelada") {
                        setDetalleId(row.idOrdenVenta);
                        setCypherId((prev) =>
                          prev === row.idOrdenVenta ? null : row.idOrdenVenta,
                        );
                        return;
                      }
                      setCypherId((prev) =>
                        prev === row.idOrdenVenta ? null : row.idOrdenVenta,
                      );
                    }}
                  />
                  {idsCorreoNoEnviado.has(row.idOrdenVenta) ? (
                    <span
                      title="Esta orden no se imprimió"
                      aria-label={`La orden ${row.venta} no se imprimió`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-polaria-danger bg-transparent text-polaria-danger"
                    >
                      <Printer
                        className="h-4 w-4"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </span>
                  ) : null}
                </span>
              );
            },
          },
        ]),
  ];
}
