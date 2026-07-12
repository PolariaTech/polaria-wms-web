"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { formatEstadoOrdenVenta } from "../../shared/constants/sales-status";
import { emitirOrdenVentaApi } from "../../shared/services/sales-api.service";
import { getOrdenVentaDetalle } from "../../shared/services/sales.service";
import type { OrdenVentaDetalleRow } from "../../shared/types/sales.types";
import {
  formatCompradorOrdenVenta,
  formatObservacionOrdenVenta,
  formatOrdenVentaLineaTotal,
  formatOrdenVentaTotal,
  resolveOrdenVentaLineaTitulo,
  sumOrdenVentaCantidadKg,
} from "../utils/orden-venta-display";

interface OrdenVentaDetalleModalProps {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  onClose: () => void;
  onEmitted?: () => void;
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="polaria-text-label text-polaria-w-20">{label}</p>
      <div className="mt-1 polaria-text-body-sm font-medium text-polaria-w">
        {children}
      </div>
    </div>
  );
}

function renderEstadoBadge(estado: string) {
  const normalized = estado.toLowerCase();
  const variant =
    normalized === "despachada" || normalized === "cerrada"
      ? "positive"
      : normalized === "cancelada"
        ? "neutral"
        : normalized === "confirmada" || normalized === "en_preparacion"
          ? "warning"
          : "neutral";

  return (
    <PolariaTableBadge variant={variant}>
      {formatEstadoOrdenVenta(estado)}
    </PolariaTableBadge>
  );
}

function DetalleContent({ orden }: { orden: OrdenVentaDetalleRow }) {
  const lineItems = orden.lineas ?? [];
  const observaciones = formatObservacionOrdenVenta(orden.observaciones);
  const destino =
    orden.bodega_destino_nombre?.trim() ||
    orden.bodega_nombre?.trim() ||
    "—";

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetaField label="Comprador">
          {formatCompradorOrdenVenta(orden)}
        </MetaField>
        <MetaField label="Fecha">
          {formatDateTime(orden.fecha_pedido || orden.created_at)}
        </MetaField>
        <MetaField label="Estado">{renderEstadoBadge(orden.estado)}</MetaField>
      </div>

      <section className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-4">
        <h3 className="polaria-text-label text-polaria-teal">Destino</h3>
        <p className="mt-2 polaria-text-body-sm font-medium text-polaria-w">
          {destino}
        </p>
      </section>

      <section>
        <h3 className="polaria-text-label text-polaria-teal">Productos</h3>

        {lineItems.length === 0 ? (
          <p className="mt-3 polaria-text-body-sm text-polaria-w-50">
            Sin líneas registradas.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-polaria-w-08">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[44%]" />
                <col className="w-[20%]" />
                <col className="w-[24%]" />
              </colgroup>
              <thead className="bg-polaria-t-08">
                <tr className="border-b border-polaria-t-20">
                  <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                    Producto
                  </th>
                  <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                    Cantidad (kg)
                  </th>
                  <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((linea) => (
                  <tr
                    key={linea.id_linea_orden_venta}
                    className="border-b border-polaria-w-08 last:border-b-0"
                  >
                    <td className="px-3 py-2.5 align-middle">
                      <p className="polaria-text-body-sm font-medium text-polaria-w">
                        {resolveOrdenVentaLineaTitulo(linea)}
                      </p>
                      <p className="polaria-text-caption text-polaria-w-50">
                        {linea.producto?.sku ? `SKU ${linea.producto.sku}` : null}
                        {linea.producto?.sku ? " · " : null}
                        ${formatPrecioEs(linea.precio_unitario)}/kg
                      </p>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                      {formatKgEs(linea.cantidad_pedida)} kg
                    </td>
                    <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm font-medium text-polaria-teal">
                      ${formatPrecioEs(formatOrdenVentaLineaTotal(linea))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-polaria-t-20 bg-polaria-t-08 px-3 py-2">
              <p className="polaria-text-caption text-polaria-w-50">
                {lineItems.length === 1
                  ? "1 producto"
                  : `${lineItems.length} productos`}{" "}
                · {formatKgEs(sumOrdenVentaCantidadKg(orden))} kg
              </p>
              <p className="polaria-text-body-sm text-polaria-w-50">
                Total venta:{" "}
                <span className="font-semibold text-polaria-teal">
                  {formatOrdenVentaTotal(orden)}
                </span>
              </p>
            </div>
          </div>
        )}
      </section>

      {observaciones !== "—" ? (
        <section className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
          <p className="polaria-text-label mb-1 text-polaria-w-20">
            Observaciones
          </p>
          <p>{observaciones}</p>
        </section>
      ) : null}
    </>
  );
}

export function OrdenVentaDetalleModal({
  idOrdenVenta,
  codigoCuenta,
  onClose,
  onEmitted,
}: OrdenVentaDetalleModalProps) {
  const [orden, setOrden] = useState<OrdenVentaDetalleRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmitting, setIsEmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reloadDetalle = useCallback(
    (options?: { silent?: boolean }) => {
      if (!idOrdenVenta || !codigoCuenta) return;

      if (!options?.silent) {
        setIsLoading(true);
      }
      setError(null);

      void getOrdenVentaDetalle({ codigoCuenta, idOrdenVenta })
        .then((row) => {
          setOrden(row);
          setActionError(null);
        })
        .catch((err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el detalle de la venta.",
          );
        })
        .finally(() => {
          if (!options?.silent) {
            setIsLoading(false);
          }
        });
    },
    [codigoCuenta, idOrdenVenta],
  );

  useEffect(() => {
    if (!idOrdenVenta || !codigoCuenta) {
      setOrden(null);
      setError(null);
      setActionError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setActionError(null);
    setOrden(null);

    void getOrdenVentaDetalle({ codigoCuenta, idOrdenVenta })
      .then((row) => {
        if (!cancelled) {
          setOrden(row);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el detalle de la venta.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, idOrdenVenta]);

  const puedeEmitir = orden?.estado === "borrador";

  const handleEmitir = () => {
    if (!idOrdenVenta || !puedeEmitir || isEmitting) {
      return;
    }

    setActionError(null);
    setIsEmitting(true);

    void emitirOrdenVentaApi(idOrdenVenta)
      .then((row) => {
        setOrden((prev) =>
          prev
            ? {
                ...prev,
                estado: row.estado,
              }
            : prev,
        );
        onEmitted?.();
        reloadDetalle({ silent: true });
      })
      .catch((err: unknown) => {
        setActionError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo emitir la venta.",
        );
      })
      .finally(() => {
        setIsEmitting(false);
      });
  };

  if (!idOrdenVenta) {
    return null;
  }

  return (
    <PolariaFormModal
      open
      onClose={onClose}
      sectionLabel="Detalle de venta"
      title={orden?.codigo ?? "Orden de venta"}
      isSubmitting={isEmitting}
      onSubmit={(event) => {
        event.preventDefault();
      }}
      hideHeaderClose
      footerAction={
        puedeEmitir ? (
          <button
            type="button"
            onClick={handleEmitir}
            disabled={isLoading || isEmitting}
            className={cn(
              "inline-flex min-w-[7rem] items-center justify-center rounded-xl bg-polaria-teal px-4 py-2.5",
              "polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {isEmitting ? "Emitiendo…" : "Emitir venta"}
          </button>
        ) : (
          <></>
        )
      }
      compact
      size="lg"
    >
      {isLoading ? (
        <p className="polaria-text-body-sm text-polaria-w-50">Cargando…</p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger"
        >
          {error}
        </p>
      ) : null}

      {actionError ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger"
        >
          {actionError}
        </p>
      ) : null}

      {!isLoading && !error && orden ? <DetalleContent orden={orden} /> : null}
    </PolariaFormModal>
  );
}
