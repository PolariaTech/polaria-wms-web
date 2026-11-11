"use client";

import type { ReactNode } from "react";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import {
  formatEstadoOrdenVenta,
  variantEstadoOrdenVenta,
} from "../../../shared/constants/sales-status";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { formatCapturaFecha } from "../../utils/pedido/build-orden-venta-captura-observaciones";
import { CaptureSection } from "./CaptureSection";
import { DireccionEntregaField } from "./DireccionEntregaField";
import {
  OrdenVentaDetalleDiaSemana,
  OrdenVentaDetalleIdentidadCliente,
} from "./OrdenVentaDetalleIdentidadCliente";
import { partirVentanaEntrega } from "./orden-campos-datos-pedido";

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

/**
 * REQ-305: visualización de Datos del pedido + Entrega alineada a edición (REQ-278).
 * Moneda en pedido; prioridad oculta; dirección y notas al final de Entrega.
 */
export function OrdenVentaDetalleDatosPedidoEntrega({
  orden,
  clienteNombre,
  ordenCompraHotel,
  folioFactura,
  centroConsumo,
  referenciaPedido,
  moneda,
  fechaEntrega,
  ventanaEntrega,
  contacto,
  telefono,
  correo,
  direccion,
  notasGenerales,
}: {
  orden: OrdenVentaDetalleRow;
  clienteNombre: string;
  ordenCompraHotel: string;
  folioFactura: string;
  centroConsumo: string;
  referenciaPedido: string;
  moneda: string;
  fechaEntrega: string;
  ventanaEntrega: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  notasGenerales: string;
}) {
  const entregaLat =
    typeof orden.entrega_lat === "number" && Number.isFinite(orden.entrega_lat)
      ? orden.entrega_lat
      : null;
  const entregaLng =
    typeof orden.entrega_lng === "number" && Number.isFinite(orden.entrega_lng)
      ? orden.entrega_lng
      : null;
  const { desde, hasta } = partirVentanaEntrega(ventanaEntrega);

  return (
    <>
      <CaptureSection title="Datos del pedido">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <OrdenVentaDetalleIdentidadCliente
            orden={orden}
            clienteNombre={clienteNombre}
          />
          <MetaField label="Orden de compra del cliente">
            <TextValue value={ordenCompraHotel} />
          </MetaField>
          <MetaField label="Folio de factura">
            <TextValue value={folioFactura} />
          </MetaField>
          <MetaField label="Centro de consumo">
            <TextValue value={centroConsumo} />
          </MetaField>
          <MetaField label="Moneda">
            <TextValue value={moneda || "MXN"} />
          </MetaField>
          <MetaField label="Referencia de pedido">
            <TextValue value={referenciaPedido} />
          </MetaField>
          <MetaField label="Fecha de creación">
            {formatDateTime(orden.created_at || orden.fecha_pedido)}
          </MetaField>
          <MetaField label="Estado">
            <PolariaTableBadge variant={variantEstadoOrdenVenta(orden.estado)}>
              {formatEstadoOrdenVenta(orden.estado)}
            </PolariaTableBadge>
          </MetaField>
        </div>
      </CaptureSection>

      <CaptureSection title="Entrega">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaField label="Fecha de entrega">
            <TextValue
              value={fechaEntrega ? formatCapturaFecha(fechaEntrega) : ""}
            />
          </MetaField>
          <OrdenVentaDetalleDiaSemana fechaEntrega={fechaEntrega} />
          <MetaField label="Hora desde">
            <TextValue value={desde} />
          </MetaField>
          <MetaField label="Hora hasta">
            <TextValue value={hasta} />
          </MetaField>
          <MetaField label="Contacto del cliente">
            <TextValue value={contacto} />
          </MetaField>
          <MetaField label="Teléfono del contacto">
            <TextValue value={telefono} />
          </MetaField>
          <MetaField label="Correo del contacto">
            <TextValue value={correo} />
          </MetaField>
          <DireccionEntregaField
            id="detalle-orden-venta-direccion"
            value={direccion}
            onChange={() => undefined}
            entregaLat={entregaLat}
            entregaLng={entregaLng}
            soloLectura
          />
          <div className="sm:col-span-3">
            <MetaField label="Notas generales">
              <p className="whitespace-pre-wrap">
                {notasGenerales.trim() || "—"}
              </p>
            </MetaField>
          </div>
        </div>
      </CaptureSection>
    </>
  );
}
