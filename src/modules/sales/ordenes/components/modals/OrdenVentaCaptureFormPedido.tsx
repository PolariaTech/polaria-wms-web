"use client";

import { PolariaDateInputDdMm } from "@/components/shared/form/PolariaDateInputDdMm";
import {
  PolariaFormField,
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import {
  FECHA_ENTREGA_ATRASADA_WARNING,
  isFechaEntregaAtrasada,
  isFechaEntregaIsoValida,
  isVentanaDesdeMayorQueHasta,
} from "../../utils/pedido/pedido-form-validation";
import { fieldControlClass } from "../../utils/pedido/orden-venta-create-helpers";
import { salirDeHoraConTab } from "../../utils/pedido/resolve-cabecera-guardada";
import { todayIsoDate } from "../../utils/pedido/build-orden-venta-captura-observaciones";
import { PRIORIDAD_OPTIONS } from "../../types/orden-venta-create-modal.types";

type Marks = {
  autoFields: Set<string>;
  warnFields: Set<string>;
  missingFields: Set<string>;
};

export function OrdenVentaCaptureFormPedido(props: {
  ordenCompraHotel: string;
  onOrdenCompraHotel: (value: string) => void;
  exigeOc: boolean;
  centroConsumo: string;
  onCentroConsumo: (value: string) => void;
  fechaEntrega: string;
  onFechaEntrega: (iso: string) => void;
  onClearFechaError: () => void;
  esPorConfirmar: boolean;
  ventanaDesde: string;
  onVentanaDesde: (value: string) => void;
  ventanaHasta: string;
  onVentanaHasta: (value: string) => void;
  prioridad: string;
  onPrioridad: (value: string) => void;
  moneda: string;
  onBuscarMoneda: () => void;
  observaciones: string;
  onObservaciones: (value: string) => void;
  onClearField: (field: string) => void;
  marks: Marks;
}) {
  return (
    <>
      <OcYCentro {...props} />
      <FechaEntregaCampo {...props} />
      <VentanaDesde {...props} />
      <VentanaHasta {...props} />
      <PrioridadMonedaNotas {...props} />
    </>
  );
}

function OcYCentro(props: {
  ordenCompraHotel: string;
  onOrdenCompraHotel: (value: string) => void;
  exigeOc: boolean;
  centroConsumo: string;
  onCentroConsumo: (value: string) => void;
  onClearField: (field: string) => void;
  marks: Marks;
}) {
  return (
    <>
      <PolariaFormInput
        id="orden-venta-oc-hotel"
        label="Orden de compra del cliente"
        value={props.ordenCompraHotel}
        onChange={(event) => {
          props.onOrdenCompraHotel(event.target.value);
          props.onClearField("ordenCompraHotel");
        }}
        hint={props.exigeOc ? "Este cliente exige OC para facturar." : undefined}
        required={props.exigeOc}
        data-ov-revision="ordenCompra"
        controlClassName={fieldControlClass({
          field: "ordenCompraHotel",
          ...props.marks,
          missing: props.exigeOc && !props.ordenCompraHotel.trim(),
        })}
        compact
      />
      <PolariaFormInput
        id="orden-venta-centro"
        label="Centro de consumo"
        value={props.centroConsumo}
        onChange={(event) => {
          props.onCentroConsumo(event.target.value);
          props.onClearField("centroConsumo");
        }}
        controlClassName={fieldControlClass({
          field: "centroConsumo",
          ...props.marks,
        })}
        hint={
          props.marks.warnFields.has("centroConsumo")
            ? "Registrado en ficha distinto al del pedido"
            : undefined
        }
        compact
      />
    </>
  );
}

function FechaEntregaCampo(props: {
  fechaEntrega: string;
  onFechaEntrega: (iso: string) => void;
  onClearFechaError: () => void;
  esPorConfirmar: boolean;
  onClearField: (field: string) => void;
  marks: Marks;
}) {
  const atrasada = isFechaEntregaAtrasada(props.fechaEntrega, todayIsoDate());
  return (
    <div data-ov-revision="fechaEntrega">
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
    </div>
  );
}

function VentanaDesde(props: {
  ventanaDesde: string;
  ventanaHasta: string;
  onVentanaDesde: (value: string) => void;
  onClearField: (field: string) => void;
  marks: Marks;
}) {
  return (
    <PolariaFormInput
      id="orden-venta-ventana-desde"
      label="Ventana de entrega — desde"
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
        missing: isVentanaDesdeMayorQueHasta(props.ventanaDesde, props.ventanaHasta),
      })}
      compact
    />
  );
}

function VentanaHasta(props: {
  ventanaDesde: string;
  ventanaHasta: string;
  onVentanaHasta: (value: string) => void;
  onClearField: (field: string) => void;
  marks: Marks;
}) {
  return (
    <PolariaFormInput
      id="orden-venta-ventana-hasta"
      label="Ventana de entrega — hasta"
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
        missing: isVentanaDesdeMayorQueHasta(props.ventanaDesde, props.ventanaHasta),
      })}
      compact
    />
  );
}

function PrioridadMonedaNotas(props: {
  prioridad: string;
  onPrioridad: (value: string) => void;
  moneda: string;
  onBuscarMoneda: () => void;
  observaciones: string;
  onObservaciones: (value: string) => void;
  onClearField: (field: string) => void;
  marks: Marks;
}) {
  return (
    <>
      <PolariaFormSelect
        id="orden-venta-prioridad"
        label="Prioridad"
        value={props.prioridad}
        onChange={(event) => props.onPrioridad(event.target.value)}
        options={PRIORIDAD_OPTIONS}
        compact
      />
      <PolariaFormField id="orden-venta-moneda" label="Moneda" compact>
        <JefeBodegaModalSearchField
          id="orden-venta-moneda"
          value={props.moneda}
          placeholder="Selecciona una moneda"
          ariaLabel="Moneda"
          compact
          onSearchClick={props.onBuscarMoneda}
        />
      </PolariaFormField>
      <PolariaFormInput
        id="orden-venta-observaciones"
        label="Notas generales"
        value={props.observaciones}
        placeholder="Notas generales para almacén"
        onChange={(event) => {
          props.onObservaciones(event.target.value);
          props.onClearField("observaciones");
        }}
        controlClassName={fieldControlClass({
          field: "observaciones",
          ...props.marks,
        })}
        compact
        fieldClassName="sm:col-span-3"
      />
    </>
  );
}
