"use client";

import { AlertTriangle, CheckCircle2, Replace, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { PolariaFormInput, POLARIA_FORM_INPUT_CLASS_COMPACT } from "@/components/shared/form/PolariaFormField";
import { parseDecimalEs } from "@/lib/utils/decimal-es";
import { cn } from "@/lib/utils/cn";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import {
  collectSugerenciasLinea,
  formatProductoNombreConSku,
} from "../../utils/pedido/orden-venta-create-helpers";
import { CatalogStatusHint } from "./catalog-status-hint";
import { CaptureSection } from "./CaptureSection";
import { DireccionEntregaField } from "./DireccionEntregaField";
import { NotasGeneralesPedidoField } from "./NotasGeneralesPedidoField";
import { fieldControlClass } from "../../utils/pedido/orden-venta-create-helpers";

export function OrdenVentaCaptureFormEntrega({
  direccion,
  onDireccion,
  avisoVerificarDireccion,
  entregaLat = null,
  entregaLng = null,
  onEntregaCoords,
  contacto,
  onContacto,
  telefono,
  onTelefono,
  correo,
  onCorreo,
  observaciones,
  onObservaciones,
  onClearField,
  autoFields,
  warnFields,
  missingFields,
  children,
}: {
  /** REQ-278: fecha/día/horas primero; luego contacto; dirección; notas al final. */
  children?: ReactNode;
  direccion: string;
  onDireccion: (value: string) => void;
  avisoVerificarDireccion: boolean;
  /** REQ-251 */
  entregaLat?: number | null;
  entregaLng?: number | null;
  onEntregaCoords?: (coords: { lat: number; lng: number } | null) => void;
  contacto: string;
  onContacto: (value: string) => void;
  telefono: string;
  onTelefono: (value: string) => void;
  correo: string;
  onCorreo: (value: string) => void;
  observaciones: string;
  onObservaciones: (value: string) => void;
  onClearField: (field: string) => void;
  autoFields: Set<string>;
  warnFields: Set<string>;
  missingFields: Set<string>;
}) {
  const marks = { autoFields, warnFields, missingFields };
  return (
    <CaptureSection title="Entrega">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {children}
        <PolariaFormInput
          id="orden-venta-contacto"
          label="Contacto del cliente"
          value={contacto}
          onChange={(event) => {
            onContacto(event.target.value);
            onClearField("contacto");
          }}
          controlClassName={fieldControlClass({ field: "contacto", ...marks })}
          compact
        />
        <PolariaFormInput
          id="orden-venta-telefono"
          label="Teléfono del contacto"
          type="tel"
          value={telefono}
          onChange={(event) => {
            onTelefono(event.target.value);
            onClearField("telefono");
          }}
          controlClassName={fieldControlClass({ field: "telefono", ...marks })}
          compact
        />
        <PolariaFormInput
          id="orden-venta-correo"
          label="Correo del contacto"
          type="email"
          value={correo}
          onChange={(event) => {
            onCorreo(event.target.value);
            onClearField("correo");
          }}
          controlClassName={fieldControlClass({ field: "correo", ...marks })}
          compact
        />
        <DireccionEntregaField
          id="orden-venta-direccion"
          value={direccion}
          onChange={(event) => {
            onDireccion(event.target.value);
            onEntregaCoords?.(null);
            onClearField("direccion");
          }}
          entregaLat={entregaLat}
          entregaLng={entregaLng}
          onEntregaCoords={onEntregaCoords}
          onDireccionFromMapa={(next) => {
            onDireccion(next);
            onClearField("direccion");
          }}
          controlClassName={fieldControlClass({ field: "direccion", ...marks })}
          footer={
            avisoVerificarDireccion ? (
              <p className="mt-1.5 rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 polaria-text-caption text-polaria-warning">
                Cambiaste el cliente. Revisa que la dirección de entrega (la del
                correo o PDF) sea la correcta para este pedido. Si no, corrígela
                aquí; se enviará la que dejes en este campo.
              </p>
            ) : null
          }
        />
        <NotasGeneralesPedidoField
          id="orden-venta-observaciones"
          value={observaciones}
          onChange={(event) => {
            onObservaciones(event.target.value);
            onClearField("observaciones");
          }}
          controlClassName={fieldControlClass({
            field: "observaciones",
            ...marks,
          })}
        />
      </div>
    </CaptureSection>
  );
}

export function CeldaProducto({
  linea,
  index,
  onOpenReplace,
}: {
  linea: LineaVentaForm;
  index: number;
  onOpenReplace: (index: number) => void;
}) {
  const pending = Boolean(linea.catalogPending || !linea.idProducto);
  const tieneSugerencias = collectSugerenciasLinea(linea).length > 0;
  const productoError = pending && !tieneSugerencias;
  const productoWarn = pending && tieneSugerencias;
  const nombreVisible = formatProductoNombreConSku(
    pending ? linea.aliasCliente || linea.nombre : linea.nombre,
    linea.codigo,
  );
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border px-2 py-1.5 ring-1",
        !pending && "border-polaria-teal bg-polaria-t-08 ring-polaria-teal/50 shadow-[0_0_18px_var(--teal-glow-strong)]",
        productoWarn && "border-polaria-warning bg-polaria-warning-bg ring-polaria-warning/50 shadow-[0_0_18px_var(--warning-border)]",
        productoError && "border-polaria-danger bg-polaria-danger-bg ring-polaria-danger/50 shadow-[0_0_18px_var(--danger-border)]",
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="min-w-0 flex-1 truncate polaria-text-body-sm font-medium text-polaria-w" title={nombreVisible}>
          {nombreVisible}
        </p>
        <EstadoProducto pending={pending} warn={productoWarn} />
        <button
          type="button"
          data-ov-revision={`producto-${index}`}
          onClick={() => onOpenReplace(index)}
          title={linea.aliasCliente ? `Cliente: ${linea.aliasCliente}` : "Cambiar producto"}
          aria-label="Cambiar producto"
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 polaria-text-caption font-medium transition hover:opacity-90",
            productoError
              ? "border-polaria-danger bg-polaria-danger-bg text-polaria-danger"
              : productoWarn
                ? "border-polaria-warning bg-polaria-warning-bg text-polaria-warning"
                : "border-polaria-t-20 bg-polaria-t-08 text-polaria-w hover:bg-polaria-t-20",
          )}
        >
          <Replace className="h-3 w-3 shrink-0" aria-hidden />
          Cambiar
        </button>
      </div>
      {linea.aliasCliente?.trim() ? (
        <p className="mt-1 break-words text-[11px] leading-snug text-polaria-teal/80">
          Solicitado: <span className="text-polaria-w-50">{linea.aliasCliente.trim()}</span>
        </p>
      ) : null}
    </div>
  );
}

export function EstadoProducto({ pending, warn }: { pending: boolean; warn: boolean }) {
  if (!pending) {
    return (
      <CatalogStatusHint label="Producto coincide con el catálogo" tone="teal">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      </CatalogStatusHint>
    );
  }
  if (warn) {
    return (
      <CatalogStatusHint label="Producto sin coincidencia exacta en el catálogo" tone="warning">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      </CatalogStatusHint>
    );
  }
  return (
    <CatalogStatusHint label="Producto no identificado: elige uno del catálogo" tone="danger">
      <XCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
    </CatalogStatusHint>
  );
}

export function CeldaEspecificacion({
  linea,
  index,
  onChange,
}: {
  linea: LineaVentaForm;
  index: number;
  onChange: (index: number, value: string) => void;
}) {
  return (
    <div className="flex h-full min-h-full items-stretch">
      <input
        aria-label={`Especificación de ${linea.nombre}`}
        type="text"
        value={linea.especificacion}
        onChange={(event) => onChange(index, event.target.value)}
        className={cn(
          POLARIA_FORM_INPUT_CLASS_COMPACT,
          "h-full min-h-full px-2",
          linea.filledByIa && linea.especificacion && "!border-polaria-teal/50 !bg-polaria-t-08",
        )}
      />
    </div>
  );
}

export function CeldaCantidad({
  linea,
  index,
  onChange,
  onBlur,
}: {
  linea: LineaVentaForm;
  index: number;
  onChange: (index: number, value: string) => void;
  onBlur: (index: number, value: string) => void;
}) {
  const focusKey = linea.idProducto || `pending-${index}`;
  return (
    <div className="flex h-full min-h-full items-stretch">
      <input
        id={`orden-venta-cantidad-${focusKey}`}
        data-ov-revision={`cantidad-${index}`}
        aria-label={`Cantidad de ${linea.nombre}`}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={linea.cantidadInput}
        placeholder="0"
        onChange={(event) => onChange(index, event.target.value)}
        onBlur={(event) => onBlur(index, event.target.value)}
        className={cn(
          POLARIA_FORM_INPUT_CLASS_COMPACT,
          "h-full min-h-full px-2 tabular-nums",
          fieldMissingCantidad(linea) ??
            (linea.filledByIa ? "!border-polaria-teal/50 !bg-polaria-t-08" : undefined),
        )}
      />
    </div>
  );
}

export function fieldMissingCantidad(linea: LineaVentaForm): string | undefined {
  return fieldControlClass({
    missing: !linea.cantidadInput.trim() || (parseDecimalEs(linea.cantidadInput) ?? 0) <= 0,
  });
}

