"use client";

import { Trash2 } from "lucide-react";
import {
  PolariaFormField,
  PolariaFormInput,
  PolariaFormSelect,
  POLARIA_FORM_INPUT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import { cn } from "@/lib/utils/cn";
import { buildCompradorGrupoSelectOptions } from "../constants/comprador-grupos";
import {
  emptyAltaCentroRow,
  emptyAltaContactoRow,
  type CompradorAltaFormState,
} from "../utils/comprador-alta";
import {
  REGIMEN_OPTIONS,
  USO_CFDI_OPTIONS,
  ESTADO_OPTIONS,
  METODO_PAGO_OPTIONS,
  FORMA_PAGO_OPTIONS,
  SI_NO_OPTIONS,
  SUSTITUCIONES_OPTIONS,
  TOLERANCIA_OPTIONS,
  FORMATO_PEDIDO_OPTIONS,
  ROL_CONTACTO_OPTIONS,
  CARRETERA_OPTIONS,
} from "./comprador-alta-form-options";
import {
  AddRowButton,
  StepShell,
  patchCentro,
  patchContacto,
  patchFicha,
} from "./comprador-alta-form-shared";

export type CompradorAltaSectionProps = {
  show: boolean;
  bare: boolean;
  form: CompradorAltaFormState;
  onChange: (next: CompradorAltaFormState) => void;
  disabled?: boolean;
  idPrefix: string;
  codigoValue?: string;
  nombreAutoFocus?: boolean;
  grupoSelectOptions?: { value: string; label: string }[];
};

export function CompradorAltaFormCondicionesSection(props: CompradorAltaSectionProps) {
  const { show, bare, form, onChange, disabled, idPrefix } = props;
  const { ficha } = form;
  return (
    <StepShell
            show={show}
            bare={bare}
            title="Condiciones comerciales"
            optional="Llenan solas la sección fiscal del pedido"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PolariaFormInput
                id={`${idPrefix}-credito`}
                label="Días de crédito"
                type="number"
                min={0}
                value={ficha.diasCredito}
                onChange={(event) =>
                  patchFicha(form, onChange, { diasCredito: event.target.value })
                }
                disabled={disabled}
                compact
              />
              <PolariaFormInput
                id={`${idPrefix}-limite`}
                label="Límite de crédito (MXN)"
                type="number"
                min={0}
                value={ficha.limiteCredito}
                onChange={(event) =>
                  patchFicha(form, onChange, { limiteCredito: event.target.value })
                }
                disabled={disabled}
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-metodo`}
                label="Método de pago"
                value={ficha.metodoPago}
                onChange={(event) =>
                  patchFicha(form, onChange, { metodoPago: event.target.value })
                }
                options={METODO_PAGO_OPTIONS}
                disabled={disabled}
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-forma`}
                label="Forma de pago"
                value={ficha.formaPago}
                onChange={(event) =>
                  patchFicha(form, onChange, { formaPago: event.target.value })
                }
                options={FORMA_PAGO_OPTIONS}
                disabled={disabled}
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-moneda`}
                label="Moneda"
                value={ficha.moneda}
                onChange={(event) =>
                  patchFicha(form, onChange, { moneda: event.target.value })
                }
                options={[
                  { value: "MXN", label: "MXN" },
                  { value: "USD", label: "USD" },
                ]}
                disabled={disabled}
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-oc`}
                label="¿Exige orden de compra para facturar?"
                value={ficha.exigeOc}
                onChange={(event) =>
                  patchFicha(form, onChange, { exigeOc: event.target.value })
                }
                options={SI_NO_OPTIONS}
                disabled={disabled}
                compact
              />
              <PolariaFormInput
                id={`${idPrefix}-correo-cfdi`}
                label="Correos para envío del CFDI"
                value={ficha.correosCfdi}
                placeholder="cuentasporpagar@cliente.com, compras@cliente.com"
                onChange={(event) =>
                  patchFicha(form, onChange, { correosCfdi: event.target.value })
                }
                disabled={disabled}
                compact
                fieldClassName="sm:col-span-2"
              />
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2.5 sm:col-span-3">
                <input
                  type="checkbox"
                  checked={ficha.complementoPago}
                  onChange={(event) =>
                    patchFicha(form, onChange, { complementoPago: event.target.checked })
                  }
                  disabled={disabled}
                  className="mt-0.5 accent-polaria-teal"
                />
                <span className="polaria-text-body-sm text-polaria-w">
                  El cliente requiere complemento de pago por cada abono recibido
                </span>
              </label>
            </div>
          </StepShell>
  );
}
