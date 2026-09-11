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
  formatCapturaFecha,
  notaCapturaForProducto,
  parseOrdenVentaCapturaObservaciones,
} from "../utils/build-orden-venta-captura-observaciones";
import {
  formatCompradorOrdenVenta,
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

function CaptureSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <h3 className="border-b border-polaria-w-08 px-4 py-2.5 polaria-text-label uppercase tracking-wide text-polaria-teal">
        {title}
      </h3>
      <div className="p-4">{children}</div>
    </section>
  );
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
      <div className="mt-1 break-words polaria-text-body-sm font-medium text-polaria-w">
        {children}
      </div>
    </div>
  );
}

function TextValue({ value }: { value: string | undefined }) {
  const trimmed = value?.trim() ?? "";
  return <>{trimmed || "—"}</>;
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
  const fromObs = parseOrdenVentaCapturaObservaciones(orden.observaciones);
  const ventanaFlat =
    orden.ventana_desde?.trim() || orden.ventana_hasta?.trim()
      ? `${orden.ventana_desde?.trim() || "—"} – ${orden.ventana_hasta?.trim() || "—"}`
      : "";
  const captura = {
    ...fromObs,
    prioridad: orden.prioridad?.trim() || fromObs.prioridad,
    ordenCompraHotel:
      orden.orden_compra_hotel?.trim() || fromObs.ordenCompraHotel,
    centroConsumo: orden.centro_consumo?.trim() || fromObs.centroConsumo,
    vendedor: orden.vendedor?.trim() || fromObs.vendedor,
    moneda: orden.moneda?.trim() || fromObs.moneda,
    bodegaDestino:
      orden.bodega_destino_label?.trim() || fromObs.bodegaDestino,
    direccion: orden.direccion_entrega?.trim() || fromObs.direccion,
    anden: orden.anden?.trim() || fromObs.anden,
    contacto: orden.contacto_entrega?.trim() || fromObs.contacto,
    telefono: orden.telefono_contacto?.trim() || fromObs.telefono,
    turno: orden.turno?.trim() || fromObs.turno,
    horaSalida: orden.hora_salida?.trim() || fromObs.horaSalida,
    chofer: orden.chofer?.trim() || fromObs.chofer,
    unidad: orden.unidad?.trim() || fromObs.unidad,
    aceptaSustituciones:
      orden.acepta_sustituciones?.trim() || fromObs.aceptaSustituciones,
    requiereLote: orden.requiere_lote?.trim() || fromObs.requiereLote,
    registrarTemperatura:
      orden.registrar_temperatura?.trim() || fromObs.registrarTemperatura,
    fechaEntrega: orden.fecha_entrega?.trim() || fromObs.fechaEntrega,
    ventanaEntrega: ventanaFlat || fromObs.ventanaEntrega,
    notasLineas: orden.notas_lineas?.trim() || fromObs.notasLineas,
  };
  const prioridad = captura.prioridad.trim();

  return (
    <>
      {captura.origenTexto || captura.origenArchivos.length > 0 ? (
        <CaptureSection title="De dónde salió este pedido">
          {captura.origenTexto ? (
            <p className="whitespace-pre-wrap border-l-2 border-polaria-teal pl-3 polaria-text-body-sm text-polaria-w">
              «{captura.origenTexto}»
            </p>
          ) : null}
          {captura.origenArchivos.length > 0 ? (
            <div className={cn("flex flex-wrap gap-2", captura.origenTexto && "mt-2")}>
              {captura.origenArchivos.map((name) => (
                <span
                  key={name}
                  className="rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-2 py-1 polaria-text-caption text-polaria-w-50"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : null}
        </CaptureSection>
      ) : null}

      <CaptureSection title="Datos del pedido">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaField label="Cliente">{formatCompradorOrdenVenta(orden)}</MetaField>
          <MetaField label="Orden de compra del hotel">
            <TextValue value={captura.ordenCompraHotel} />
          </MetaField>
          <MetaField label="Centro de consumo / cocina">
            <TextValue value={captura.centroConsumo} />
          </MetaField>
          <MetaField label="Vendedor">
            <TextValue value={captura.vendedor} />
          </MetaField>
          <MetaField label="Fecha de captura">
            {formatDateTime(orden.created_at || orden.fecha_pedido)}
          </MetaField>
          <MetaField label="Fecha de entrega">
            <TextValue
              value={
                captura.fechaEntrega
                  ? formatCapturaFecha(captura.fechaEntrega)
                  : ""
              }
            />
          </MetaField>
          <MetaField label="Ventana de entrega">
            <TextValue value={captura.ventanaEntrega} />
          </MetaField>
          <MetaField label="Prioridad">
            {prioridad ? (
              <PolariaTableBadge
                variant={prioridad.toLowerCase() === "urgente" ? "warning" : "neutral"}
              >
                {prioridad}
              </PolariaTableBadge>
            ) : (
              "—"
            )}
          </MetaField>
          <MetaField label="Estado">{renderEstadoBadge(orden.estado)}</MetaField>
          <MetaField label="Bodega origen">
            <TextValue value={orden.bodega_nombre ?? ""} />
          </MetaField>
          <MetaField label="Bodega destino">
            <TextValue
              value={
                orden.bodega_destino_nombre?.trim() || captura.bodegaDestino
              }
            />
          </MetaField>
          <MetaField label="Moneda">
            <TextValue value={captura.moneda || "MXN"} />
          </MetaField>
        </div>
      </CaptureSection>

      <CaptureSection title="Entrega">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaField label="Dirección de entrega">
            <TextValue value={captura.direccion} />
          </MetaField>
          <MetaField label="Andén / punto de recepción">
            <TextValue value={captura.anden} />
          </MetaField>
          <MetaField label="Contacto en el hotel">
            <TextValue value={captura.contacto} />
          </MetaField>
          <MetaField label="Teléfono del contacto">
            <TextValue value={captura.telefono} />
          </MetaField>
          <MetaField label="Turno que prepara">
            <TextValue value={captura.turno} />
          </MetaField>
          <MetaField label="Hora sugerida de salida">
            <TextValue value={captura.horaSalida} />
          </MetaField>
          <MetaField label="Chofer">
            <TextValue value={captura.chofer} />
          </MetaField>
          <MetaField label="Unidad">
            <TextValue value={captura.unidad} />
          </MetaField>
        </div>
      </CaptureSection>

      <CaptureSection title="Productos">
        {lineItems.length === 0 ? (
          <p className="polaria-text-body-sm text-polaria-w-50">
            Sin líneas registradas.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-polaria-w-08">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[44%]" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="bg-polaria-w-08">
                <tr className="border-b border-polaria-t-20">
                  <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                    Producto
                  </th>
                  <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                    Cantidad
                  </th>
                  <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                    Precio
                  </th>
                  <th className="px-3 py-2.5 text-right polaria-text-caption font-medium text-polaria-w-50">
                    Importe
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((linea) => {
                  const titulo = resolveOrdenVentaLineaTitulo(linea);
                  const nota = notaCapturaForProducto(captura.notasLineas, titulo);
                  return (
                    <tr
                      key={linea.id_linea_orden_venta}
                      className="border-b border-polaria-w-08 last:border-b-0"
                    >
                      <td className="px-3 py-2.5 align-middle">
                        <p className="polaria-text-body-sm font-medium text-polaria-w">
                          {titulo}
                        </p>
                        <p className="polaria-text-caption text-polaria-w-50">
                          {linea.producto?.sku ? `SKU ${linea.producto.sku}` : "kg"}
                          {nota ? ` · ${nota}` : null}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                        {formatKgEs(linea.cantidad_pedida)} kg
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm text-polaria-w">
                        ${formatPrecioEs(linea.precio_unitario)}
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right polaria-text-body-sm font-medium text-polaria-teal">
                        ${formatPrecioEs(formatOrdenVentaLineaTotal(linea))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-polaria-t-20 bg-polaria-w-08 px-3 py-2">
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
      </CaptureSection>

      <CaptureSection title="Almacén y política del cliente">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaField label="Peso total (kg)">
            {formatKgEs(sumOrdenVentaCantidadKg(orden))}
          </MetaField>
          <MetaField label="¿Acepta sustituciones?">
            <TextValue value={captura.aceptaSustituciones} />
          </MetaField>
          <MetaField label="Requiere lote / trazabilidad">
            <TextValue value={captura.requiereLote} />
          </MetaField>
          <MetaField label="Registrar temperatura al entregar">
            <TextValue value={captura.registrarTemperatura} />
          </MetaField>
        </div>
      </CaptureSection>

      {captura.observaciones ? (
        <CaptureSection title="Observaciones">
          <p className="whitespace-pre-wrap polaria-text-body-sm text-polaria-w">
            {captura.observaciones}
          </p>
        </CaptureSection>
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
      description={
        orden ? formatCompradorOrdenVenta(orden) : "Ficha de captura del pedido."
      }
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
      size="2xl"
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
