"use client";

import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import type { BodegaDestinoCompraRow } from "../../shared/types/purchases-api.types";
import type {
  DestinoTipoOrden,
  OrdenCompraRow,
} from "../../shared/types/purchases.types";
import {
  formatDestinoTipoOrdenValue,
  formatFechaOrden,
} from "../utils/orden-compra-display";
import { OrdenCompraDetalleMetaField as MetaField } from "./OrdenCompraDetalleMetaField";
import { DESTINO_TIPO_OPTIONS } from "./orden-compra-detalle.types";

interface OrdenCompraDetalleDestinoSectionProps {
  orden: OrdenCompraRow;
  canEditDestino: boolean;
  destinoTipo: DestinoTipoOrden;
  idBodega: string;
  fechaEntrega: string;
  bodegasDestino: BodegaDestinoCompraRow[];
  bodegaOptions: { value: string; label: string }[];
  bodegaReadLabel: string;
  isLoadingBodegas: boolean;
  isSavingDestino: boolean;
  bodegasError: string | null;
  destinoError: string | null;
  onFechaEntregaChange: (value: string) => void;
  onDestinoTipoChange: (value: DestinoTipoOrden) => void;
  onBodegaChange: (value: string) => void;
}

export function OrdenCompraDetalleDestinoSection({
  orden,
  canEditDestino,
  destinoTipo,
  idBodega,
  fechaEntrega,
  bodegasDestino,
  bodegaOptions,
  bodegaReadLabel,
  isLoadingBodegas,
  isSavingDestino,
  bodegasError,
  destinoError,
  onFechaEntregaChange,
  onDestinoTipoChange,
  onBodegaChange,
}: OrdenCompraDetalleDestinoSectionProps) {
  return (
    <section className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-4">
      <h3 className="polaria-text-label text-polaria-teal">Destino</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {canEditDestino ? (
          <PolariaFormInput
            id="orden-fecha-entrega"
            label="Llegada estimada"
            type="date"
            value={fechaEntrega}
            onChange={(event) => onFechaEntregaChange(event.target.value)}
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
              onDestinoTipoChange(event.target.value as DestinoTipoOrden)
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
              onChange={(event) => onBodegaChange(event.target.value)}
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
  );
}
