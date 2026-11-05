"use client";

import type { ReactNode } from "react";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { diaSemanaEntregaEsTitulo } from "../../utils/pedido/dia-semana-entrega";

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

/** REQ-259: identidad del cliente en detalle (código, D. comercial, RFC). */
export function OrdenVentaDetalleIdentidadCliente({
  orden,
  clienteNombre,
}: {
  orden: OrdenVentaDetalleRow;
  clienteNombre: string;
}) {
  return (
    <>
      <MetaField label="Cliente">
        <TextValue value={clienteNombre} />
      </MetaField>
      <MetaField label="Código de cliente">
        <TextValue value={orden.comprador_codigo ?? ""} />
      </MetaField>
      <MetaField label="Denominación comercial">
        <TextValue value={orden.comprador_apodo ?? ""} />
      </MetaField>
      <MetaField label="RFC">
        <TextValue value={orden.comprador_rfc ?? ""} />
      </MetaField>
    </>
  );
}

/** REQ-257: día de la semana derivado de la fecha de entrega. */
export function OrdenVentaDetalleDiaSemana({
  fechaEntrega,
}: {
  fechaEntrega: string;
}) {
  return (
    <MetaField label="Día de la semana">
      <TextValue
        value={fechaEntrega ? diaSemanaEntregaEsTitulo(fechaEntrega) : ""}
      />
    </MetaField>
  );
}
