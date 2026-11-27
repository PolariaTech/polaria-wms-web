"use client";

import type { ReactNode } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { fieldControlClass } from "../../utils/pedido/orden-venta-create-helpers";
import { CaptureSection } from "./CaptureSection";
import { DireccionEntregaField } from "./DireccionEntregaField";
import { NotasGeneralesPedidoField } from "./NotasGeneralesPedidoField";
import {
  CeldaCantidad,
  CeldaEspecificacion,
  CeldaProducto,
  EstadoProducto,
  fieldMissingCantidad,
} from "./OrdenVentaCaptureFormEntrega-celdas";

export {
  CeldaCantidad,
  CeldaEspecificacion,
  CeldaProducto,
  EstadoProducto,
  fieldMissingCantidad,
};

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
  /** REQ-349: más de una OT → aclarar que entrega es de toda la orden. */
  multiOt = false,
  children,
}: {
  /** REQ-278: fecha/día/horas primero; luego contacto; dirección; notas al final. */
  children?: ReactNode;
  /** REQ-349 */
  multiOt?: boolean;
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
  onClearField: (field: string, valorNuevo?: string) => void;
  autoFields: Set<string>;
  warnFields: Set<string>;
  missingFields: Set<string>;
}) {
  const marks = { autoFields, warnFields, missingFields };
  return (
    <CaptureSection
      title="Entrega"
      optional={multiOt ? "Aplica a todas las OT" : undefined}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {children}
        <PolariaFormInput
          id="orden-venta-contacto"
          label="Contacto del cliente"
          value={contacto}
          onChange={(event) => {
            onContacto(event.target.value);
            onClearField("contacto", event.target.value);
          }}
          controlClassName={fieldControlClass({ field: "contacto", ...marks, vacio: !contacto.trim() })}
          compact
        />
        <PolariaFormInput
          id="orden-venta-telefono"
          label="Teléfono del contacto"
          type="tel"
          value={telefono}
          onChange={(event) => {
            onTelefono(event.target.value);
            onClearField("telefono", event.target.value);
          }}
          controlClassName={fieldControlClass({ field: "telefono", ...marks, vacio: !telefono.trim() })}
          compact
        />
        <PolariaFormInput
          id="orden-venta-correo"
          label="Correo del contacto"
          type="email"
          value={correo}
          onChange={(event) => {
            onCorreo(event.target.value);
            onClearField("correo", event.target.value);
          }}
          controlClassName={fieldControlClass({ field: "correo", ...marks, vacio: !correo.trim() })}
          compact
        />
        <DireccionEntregaField
          id="orden-venta-direccion"
          value={direccion}
          onChange={(event) => {
            onDireccion(event.target.value);
            onEntregaCoords?.(null);
            onClearField("direccion", event.target.value);
          }}
          entregaLat={entregaLat}
          entregaLng={entregaLng}
          onEntregaCoords={onEntregaCoords}
          onDireccionFromMapa={(next) => {
            onDireccion(next);
            onClearField("direccion", next);
          }}
          controlClassName={fieldControlClass({ field: "direccion", ...marks, vacio: !direccion.trim() })}
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
            onClearField("observaciones", event.target.value);
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


