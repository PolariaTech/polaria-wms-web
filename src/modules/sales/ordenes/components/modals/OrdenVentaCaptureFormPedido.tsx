"use client";

import { PolariaFormField, PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { fieldControlClass } from "../../utils/pedido/orden-venta-create-helpers";

type Marks = {
  autoFields: Set<string>;
  warnFields: Set<string>;
  missingFields: Set<string>;
};

/**
 * Datos del pedido: OC, centro, moneda y referencia (REQ-278/328).
 */
export function OrdenVentaCaptureFormPedido(props: {
  ordenCompraHotel: string;
  onOrdenCompraHotel: (value: string) => void;
  exigeOc: boolean;
  centroConsumo: string;
  onCentroConsumo: (value: string) => void;
  moneda: string;
  onBuscarMoneda: () => void;
  onClearField: (field: string, valorNuevo?: string) => void;
  marks: Marks;
  /** REQ-349: hay más de una OT en la OV. */
  multiOt?: boolean;
}) {
  const hintOc = [
    props.exigeOc ? "Este cliente exige OC para facturar." : "",
    props.multiOt ? "Aplica a todas las OT." : "",
  ]
    .filter(Boolean)
    .join(" ");
  const hintCentro = props.marks.warnFields.has("centroConsumo")
    ? "Registrado en ficha distinto al del pedido"
    : undefined;

  return (
    <>
      <PolariaFormInput
        id="orden-venta-oc-hotel"
        label="Orden de compra del cliente"
        value={props.ordenCompraHotel}
        onChange={(event) => {
          props.onOrdenCompraHotel(event.target.value);
          props.onClearField("ordenCompraHotel", event.target.value);
        }}
        hint={hintOc || undefined}
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
          props.onClearField("centroConsumo", event.target.value);
        }}
        controlClassName={fieldControlClass({
          field: "centroConsumo",
          ...props.marks,
        })}
        hint={hintCentro}
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
    </>
  );
}
