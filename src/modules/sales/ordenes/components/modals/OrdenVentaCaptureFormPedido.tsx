"use client";

import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { fieldControlClass } from "../../utils/pedido/orden-venta-create-helpers";

type Marks = {
  autoFields: Set<string>;
  warnFields: Set<string>;
  missingFields: Set<string>;
};

/**
 * Datos del pedido: orden de compra del cliente y centro de consumo. La fecha, la ventana, la
 * prioridad, la moneda y las notas pasaron a «Entrega» (REQ-216/254): ver
 * `OrdenVentaCaptureFormProgramacion`.
 */
export function OrdenVentaCaptureFormPedido(props: {
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
