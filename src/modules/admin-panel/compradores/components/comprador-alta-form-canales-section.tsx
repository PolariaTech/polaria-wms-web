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

export function CompradorAltaFormCanalesSection(props: CompradorAltaSectionProps) {
  const { show, bare, form, onChange, disabled, idPrefix } = props;
  const { ficha } = form;
  return (
    <StepShell
            show={show}
            bare={bare}
            title="Canales de pedido"
            optional="Desde dónde llegan los pedidos de este cliente"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PolariaFormInput
                id={`${idPrefix}-wa`}
                label="Números de WhatsApp autorizados"
                value={ficha.whatsapp}
                placeholder="998 000 0000, 998 111 1111"
                onChange={(event) =>
                  patchFicha(form, onChange, { whatsapp: event.target.value })
                }
                disabled={disabled}
                compact
                fieldClassName="sm:col-span-2"
              />
              <PolariaFormSelect
                id={`${idPrefix}-formato`}
                label="Formato habitual del pedido"
                value={ficha.formatoPedido}
                onChange={(event) =>
                  patchFicha(form, onChange, { formatoPedido: event.target.value })
                }
                options={FORMATO_PEDIDO_OPTIONS}
                disabled={disabled}
                compact
              />
              <PolariaFormInput
                id={`${idPrefix}-correos-pedido`}
                label="Correos desde los que piden"
                value={ficha.correosPedido}
                placeholder="chef@cliente.com, almacen@cliente.com"
                onChange={(event) =>
                  patchFicha(form, onChange, { correosPedido: event.target.value })
                }
                disabled={disabled}
                compact
                fieldClassName="sm:col-span-3"
              />
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2.5 sm:col-span-3">
                <input
                  type="checkbox"
                  checked={ficha.portalProveedores}
                  onChange={(event) =>
                    patchFicha(form, onChange, {
                      portalProveedores: event.target.checked,
                    })
                  }
                  disabled={disabled}
                  className="mt-0.5 accent-polaria-teal"
                />
                <span className="polaria-text-body-sm text-polaria-w">
                  El cliente opera un portal de proveedores con sus propios requisitos y
                  calendario
                </span>
              </label>
              {ficha.portalProveedores ? (
                <PolariaFormInput
                  id={`${idPrefix}-portal-nota`}
                  label="Portal de proveedores"
                  value={ficha.portalNota}
                  placeholder="Liga, usuario, y qué exige subir"
                  onChange={(event) =>
                    patchFicha(form, onChange, { portalNota: event.target.value })
                  }
                  disabled={disabled}
                  compact
                  fieldClassName="sm:col-span-3"
                />
              ) : null}
            </div>
          </StepShell>
  );
}
