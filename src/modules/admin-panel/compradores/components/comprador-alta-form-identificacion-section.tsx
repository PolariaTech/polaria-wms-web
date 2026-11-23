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

export function CompradorAltaFormIdentificacionSection(props: CompradorAltaSectionProps & { codigoValue: string; nombreAutoFocus?: boolean; grupoSelectOptions: { value: string; label: string }[] }) {
  const { show, bare, form, onChange, disabled, idPrefix, codigoValue, nombreAutoFocus, grupoSelectOptions } = props;
  const { ficha } = form;
  return (
    <StepShell
            show={show}
            bare={bare}
            title="Identificación comercial"
            optional="Es el que verá el vendedor al capturar"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PolariaFormInput
                id={`${idPrefix}-codigo`}
                label="Código de cliente"
                value={codigoValue}
                readOnly
                compact
              />
              <PolariaFormInput
                id={`${idPrefix}-comercial`}
                label="Nombre comercial"
                value={form.nombreComercial}
                placeholder="Cliente ejemplo"
                onChange={(event) =>
                  onChange({ ...form, nombreComercial: event.target.value })
                }
                disabled={disabled}
                required
                autoFocus={nombreAutoFocus}
                compact
              />
              <PolariaFormInput
                id={`${idPrefix}-apodo`}
                label="D. Comercial"
                value={ficha.apodo}
                placeholder="El Güero"
                onChange={(event) =>
                  patchFicha(form, onChange, { apodo: event.target.value })
                }
                disabled={disabled}
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-grupo`}
                label="Grupo perteneciente"
                value={ficha.grupo}
                onChange={(event) =>
                  patchFicha(form, onChange, { grupo: event.target.value })
                }
                options={grupoSelectOptions}
                disabled={disabled}
                compact
              />
              <PolariaFormInput
                id={`${idPrefix}-vendedor`}
                label="Vendedor asignado"
                value={ficha.vendedor || "—"}
                readOnly
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-estado`}
                label="Estado"
                value={ficha.estado}
                onChange={(event) =>
                  patchFicha(form, onChange, { estado: event.target.value })
                }
                options={ESTADO_OPTIONS}
                disabled={disabled}
                compact
              />
              <div className="sm:col-span-3">
                <PolariaPhoneInput
                  id={`${idPrefix}-telefono`}
                  label="Teléfono"
                  value={form.telefono}
                  onChange={(value) => onChange({ ...form, telefono: value })}
                  disabled={disabled}
                  hint="Opcional. Formato internacional. Si lo dejas vacío, se usa el del primer contacto."
                  compact
                />
              </div>
            </div>
          </StepShell>
  );
}
