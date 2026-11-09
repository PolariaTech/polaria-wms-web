"use client";

import { PolariaDateInputDdMm } from "@/components/shared/form/PolariaDateInputDdMm";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import {
  FECHA_ENTREGA_ATRASADA_WARNING,
  isFechaEntregaAtrasada,
  isFechaEntregaIsoValida,
  isVentanaDesdeMayorQueHasta,
} from "../../utils/pedido/pedido-form-validation";
import { fieldControlClass } from "../../utils/pedido/orden-venta-create-helpers";
import { salirDeHoraConTab } from "../../utils/pedido/resolve-cabecera-guardada";
import { todayIsoDate } from "../../utils/pedido/build-orden-venta-captura-observaciones";
import { diaSemanaEntregaEsTitulo } from "../../utils/pedido/dia-semana-entrega";

type Marks = {
  autoFields: Set<string>;
  warnFields: Set<string>;
  missingFields: Set<string>;
};

export interface OrdenVentaCaptureFormProgramacionProps {
  fechaEntrega: string;
  onFechaEntrega: (iso: string) => void;
  onClearFechaError: () => void;
  esPorConfirmar: boolean;
  ventanaDesde: string;
  onVentanaDesde: (value: string) => void;
  ventanaHasta: string;
  onVentanaHasta: (value: string) => void;
  onClearField: (field: string) => void;
  marks: Marks;
}

/**
 * REQ-278: Fecha · Día · Hora desde · Hora hasta en una sola fila.
 * Prioridad ocultada; moneda subió a «Datos del pedido»; notas van al final de Entrega.
 */
export function OrdenVentaCaptureFormProgramacion(
  props: OrdenVentaCaptureFormProgramacionProps,
) {
  const atrasada = isFechaEntregaAtrasada(props.fechaEntrega, todayIsoDate());
  const diaSemana = diaSemanaEntregaEsTitulo(props.fechaEntrega);
  return (
    <div className="col-span-full grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <PolariaDateInputDdMm
        id="orden-venta-fecha-entrega"
        label="Fecha de entrega"
        value={props.fechaEntrega}
        required={props.esPorConfirmar}
        onChange={(iso) => {
          props.onFechaEntrega(iso);
          props.onClearField("fechaEntrega");
          if (iso.trim()) props.onClearFechaError();
        }}
        hint={
          atrasada
            ? FECHA_ENTREGA_ATRASADA_WARNING
            : props.marks.missingFields.has("fechaEntrega")
              ? "Obligatoria para confirmar"
              : "Formato DD/MM/AAAA"
        }
        controlClassName={fieldControlClass({
          field: "fechaEntrega",
          autoFields: props.marks.autoFields,
          warnFields: atrasada
            ? new Set([...props.marks.warnFields, "fechaEntrega"])
            : props.marks.warnFields,
          missingFields: props.marks.missingFields,
          missing: !isFechaEntregaIsoValida(props.fechaEntrega),
        })}
        compact
      />
      <PolariaFormInput
        id="orden-venta-dia-semana-entrega"
        label="Día de la semana"
        value={diaSemana}
        readOnly
        tabIndex={-1}
        placeholder="—"
        aria-live="polite"
        compact
      />
      <PolariaFormInput
        id="orden-venta-ventana-desde"
        label="Hora desde"
        type="time"
        value={props.ventanaDesde}
        max={props.ventanaHasta || undefined}
        onChange={(event) => {
          props.onVentanaDesde(event.target.value);
          props.onClearField("ventanaDesde");
          if (
            !isVentanaDesdeMayorQueHasta(event.target.value, props.ventanaHasta)
          ) {
            props.onClearField("ventanaHasta");
          }
        }}
        data-ov-revision="ventanaDesde"
        onKeyDown={salirDeHoraConTab}
        controlClassName={fieldControlClass({
          field: "ventanaDesde",
          ...props.marks,
          missing: isVentanaDesdeMayorQueHasta(
            props.ventanaDesde,
            props.ventanaHasta,
          ),
        })}
        compact
      />
      <PolariaFormInput
        id="orden-venta-ventana-hasta"
        label="Hora hasta"
        type="time"
        value={props.ventanaHasta}
        min={props.ventanaDesde || undefined}
        onChange={(event) => {
          props.onVentanaHasta(event.target.value);
          props.onClearField("ventanaHasta");
          if (
            !isVentanaDesdeMayorQueHasta(props.ventanaDesde, event.target.value)
          ) {
            props.onClearField("ventanaDesde");
          }
        }}
        onKeyDown={salirDeHoraConTab}
        controlClassName={fieldControlClass({
          field: "ventanaHasta",
          ...props.marks,
          missing: isVentanaDesdeMayorQueHasta(
            props.ventanaDesde,
            props.ventanaHasta,
          ),
        })}
        compact
      />
    </div>
  );
}
