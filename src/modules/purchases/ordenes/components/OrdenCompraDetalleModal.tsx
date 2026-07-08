"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { listBodegasDestinoCompraApi } from "../../shared/services/purchases-api.service";
import type { BodegaDestinoCompraRow } from "../../shared/types/purchases-api.types";
import { ESTADO_ORDEN_LABELS } from "../../shared/constants/purchases-labels";
import type { DestinoTipoOrden, OrdenCompraRow } from "../../shared/types/purchases.types";
import {
  formatBodegaDestinoLabel,
  formatDestinoTipoOrdenValue,
  formatFechaOrden,
  formatObservacionOrden,
  parseDestinoTipoOrden,
  resolveOrdenLineaTitulo,
  toFechaOrdenInputValue,
} from "../utils/orden-compra-display";

export interface OrdenCompraDestinoPatch {
  destinoTipo?: DestinoTipoOrden;
  idBodega?: string;
  fechaEntregaEstimada?: string | null;
}

interface OrdenCompraDetalleModalProps {
  orden: OrdenCompraRow | null;
  codigoCuenta?: string | null;
  onClose: () => void;
  actions?: ReactNode;
  notified?: boolean;
  onDestinoChange?: (patch: OrdenCompraDestinoPatch) => void | Promise<void>;
  isSavingDestino?: boolean;
  destinoError?: string | null;
}

const DESTINO_TIPO_OPTIONS = [
  { value: "interna", label: "Bodega interna" },
  { value: "externa", label: "Bodega externa" },
] as const;

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

export function OrdenCompraDetalleModal({
  orden,
  codigoCuenta = null,
  onClose,
  actions,
  notified = false,
  onDestinoChange,
  isSavingDestino = false,
  destinoError = null,
}: OrdenCompraDetalleModalProps) {
  const [destinoTipo, setDestinoTipo] = useState<DestinoTipoOrden>("interna");
  const [idBodega, setIdBodega] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [bodegasDestino, setBodegasDestino] = useState<BodegaDestinoCompraRow[]>(
    [],
  );
  const [isLoadingBodegas, setIsLoadingBodegas] = useState(false);
  const [bodegasError, setBodegasError] = useState<string | null>(null);

  useEffect(() => {
    if (!orden) {
      return;
    }

    setDestinoTipo(parseDestinoTipoOrden(orden.destino_tipo));
    setIdBodega(orden.id_bodega?.trim() ?? "");
    setFechaEntrega(toFechaOrdenInputValue(orden.fecha_entrega_estimada));
  }, [orden]);

  const canEditDestino = orden?.estado === "borrador" && Boolean(onDestinoChange);

  useEffect(() => {
    if (!orden || !codigoCuenta) {
      setBodegasDestino([]);
      setBodegasError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingBodegas(true);
    setBodegasError(null);

    void listBodegasDestinoCompraApi({
      codigoCuenta,
      tipo: destinoTipo,
    })
      .then((rows) => {
        if (cancelled) {
          return;
        }

        setBodegasDestino(rows);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setBodegasDestino([]);
        setBodegasError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las bodegas destino.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingBodegas(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, destinoTipo, orden]);

  useEffect(() => {
    if (!canEditDestino || !idBodega || isLoadingBodegas || bodegasDestino.length === 0) {
      return;
    }

    if (!bodegasDestino.some((row) => row.idBodega === idBodega)) {
      setIdBodega("");
    }
  }, [bodegasDestino, canEditDestino, idBodega, isLoadingBodegas]);

  const bodegaSeleccionada = useMemo(
    () => bodegasDestino.find((row) => row.idBodega === idBodega) ?? null,
    [bodegasDestino, idBodega],
  );

  const bodegaOptions = useMemo(
    () =>
      bodegasDestino.map((bodega) => ({
        value: bodega.idBodega,
        label: formatBodegaDestinoLabel(bodega),
      })),
    [bodegasDestino],
  );

  if (!orden) {
    return null;
  }

  const lineItems = orden.lineas ?? [];
  const observaciones = formatObservacionOrden(orden.observaciones);

  const handleDestinoTipoChange = (nextTipo: DestinoTipoOrden) => {
    if (!canEditDestino || nextTipo === destinoTipo || isSavingDestino) {
      return;
    }

    setDestinoTipo(nextTipo);
    setIdBodega("");
    void onDestinoChange?.({ destinoTipo: nextTipo, idBodega: "" });
  };

  const handleBodegaChange = (nextBodegaId: string) => {
    if (
      !canEditDestino ||
      nextBodegaId === idBodega ||
      isSavingDestino ||
      !nextBodegaId
    ) {
      return;
    }

    setIdBodega(nextBodegaId);
    void onDestinoChange?.({ idBodega: nextBodegaId });
  };

  const handleFechaEntregaChange = (nextFecha: string) => {
    if (!canEditDestino || nextFecha === fechaEntrega || isSavingDestino) {
      return;
    }

    setFechaEntrega(nextFecha);
    void onDestinoChange?.({
      fechaEntregaEstimada: nextFecha.trim() ? nextFecha : null,
    });
  };

  const bodegaReadLabel =
    bodegaSeleccionada != null
      ? formatBodegaDestinoLabel(bodegaSeleccionada)
      : orden.id_bodega?.trim()
        ? orden.id_bodega.slice(0, 8)
        : "—";

  return (
    <PolariaFormModal
      open
      onClose={onClose}
      sectionLabel="Detalle de orden"
      title={orden.codigo}
      isSubmitting={false}
      onSubmit={(event) => {
        event.preventDefault();
      }}
      footerAction={actions ?? <></>}
      compact
      size="lg"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetaField label="Proveedor">
          {orden.proveedor_nombre?.trim() || "—"}
        </MetaField>
        <MetaField label="Fecha">
          {formatFechaOrden(orden.fecha_emision)}
        </MetaField>
        <MetaField label="Estado">
          <PolariaTableBadge variant="neutral">
            {ESTADO_ORDEN_LABELS[orden.estado] ?? orden.estado}
          </PolariaTableBadge>
        </MetaField>
      </div>

      <section className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-4">
        <h3 className="polaria-text-label text-polaria-teal">Destino</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {canEditDestino ? (
            <PolariaFormInput
              id="orden-fecha-entrega"
              label="Llegada estimada"
              type="date"
              value={fechaEntrega}
              onChange={(event) => handleFechaEntregaChange(event.target.value)}
              disabled={isSavingDestino}
              compact
            />
          ) : (
            <MetaField label="Llegada estimada">
              {formatFechaOrden(orden.fecha_entrega_estimada)}
            </MetaField>
          )}

          {canEditDestino ? (
            <PolariaFormSelect
              id="orden-destino-tipo"
              label="Tipo"
              value={destinoTipo}
              onChange={(event) =>
                handleDestinoTipoChange(event.target.value as DestinoTipoOrden)
              }
              disabled={isSavingDestino}
              options={[...DESTINO_TIPO_OPTIONS]}
              compact
            />
          ) : (
            <MetaField label="Tipo">
              {formatDestinoTipoOrdenValue(destinoTipo)}
            </MetaField>
          )}

          {canEditDestino ? (
            <div className="sm:col-span-2">
              <PolariaFormSelect
                id="orden-destino-bodega"
                label="Bodega destino"
                value={idBodega}
                onChange={(event) => handleBodegaChange(event.target.value)}
                disabled={isSavingDestino || isLoadingBodegas}
                options={[
                  {
                    value: "",
                    label: isLoadingBodegas
                      ? "Cargando bodegas…"
                      : "Selecciona una bodega",
                  },
                  ...bodegaOptions,
                ]}
                compact
              />
            </div>
          ) : (
            <div className="sm:col-span-2">
              <MetaField label="Bodega destino">{bodegaReadLabel}</MetaField>
            </div>
          )}
        </div>

        {canEditDestino && !isLoadingBodegas && bodegasDestino.length === 0 ? (
          <p className="mt-3 polaria-text-body-sm text-polaria-w-50">
            No hay{" "}
            {destinoTipo === "externa" ? "bodegas externas" : "bodegas internas"}{" "}
            con capacidad disponible en tu cuenta.
          </p>
        ) : null}

        {bodegasError ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-body-sm text-polaria-danger"
          >
            {bodegasError}
          </p>
        ) : null}

        {destinoError ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-body-sm text-polaria-danger"
          >
            {destinoError}
          </p>
        ) : null}
      </section>

      <section>
        <h3 className="polaria-text-label text-polaria-teal">Productos</h3>

        {lineItems.length === 0 ? (
          <p className="mt-3 polaria-text-body-sm text-polaria-w-50">
            Sin líneas registradas.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {lineItems.map((linea) => (
              <li
                key={linea.id_linea_orden_compra}
                className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3"
              >
                <p className="font-medium text-polaria-w">
                  {resolveOrdenLineaTitulo(linea)}
                </p>
                <p className="mt-1 polaria-text-body-sm text-polaria-w-50">
                  <span className="text-polaria-w-20">Peso:</span>{" "}
                  <span className="font-semibold tabular-nums text-polaria-w">
                    {formatKgEs(Number(linea.cantidad))} kg
                  </span>
                  {linea.producto?.sku ? (
                    <span className="ml-3">SKU {linea.producto.sku}</span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {observaciones !== "—" || notified ? (
        <section className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
          {observaciones !== "—" ? <p>{observaciones}</p> : null}
          {notified ? (
            <p className={observaciones !== "—" ? "mt-2" : undefined}>
              Proveedor notificado.
            </p>
          ) : null}
        </section>
      ) : null}
    </PolariaFormModal>
  );
}
