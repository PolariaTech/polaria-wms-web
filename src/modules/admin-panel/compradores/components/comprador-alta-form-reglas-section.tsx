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

export function CompradorAltaFormReglasSection(props: CompradorAltaSectionProps) {
  const { show, bare, form, onChange, disabled, idPrefix } = props;
  const { ficha } = form;
  return (
    <StepShell
            show={show}
            bare={bare}
            title="Reglas de operación"
            optional="Es lo que el almacén necesita saber a las 3 AM"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PolariaFormSelect
                id={`${idPrefix}-sust`}
                label="¿Acepta sustituciones?"
                value={ficha.sustituciones}
                onChange={(event) =>
                  patchFicha(form, onChange, { sustituciones: event.target.value })
                }
                options={SUSTITUCIONES_OPTIONS}
                disabled={disabled}
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-tol`}
                label="Tolerancia de peso"
                value={ficha.tolerancia}
                onChange={(event) =>
                  patchFicha(form, onChange, { tolerancia: event.target.value })
                }
                options={TOLERANCIA_OPTIONS}
                disabled={disabled}
                compact
              />
              <PolariaFormInput
                id={`${idPrefix}-vida`}
                label="Vida útil mínima al entregar (días)"
                type="number"
                min={0}
                value={ficha.vidaUtil}
                placeholder="3"
                onChange={(event) =>
                  patchFicha(form, onChange, { vidaUtil: event.target.value })
                }
                disabled={disabled}
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-lote`}
                label="¿Requiere lote y origen?"
                value={ficha.requiereLote}
                onChange={(event) =>
                  patchFicha(form, onChange, { requiereLote: event.target.value })
                }
                options={SI_NO_OPTIONS}
                disabled={disabled}
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-temp`}
                label="¿Requiere temperatura al entregar?"
                value={ficha.requiereTemp}
                onChange={(event) =>
                  patchFicha(form, onChange, { requiereTemp: event.target.value })
                }
                options={SI_NO_OPTIONS}
                disabled={disabled}
                compact
              />
              <PolariaFormSelect
                id={`${idPrefix}-ficha`}
                label="¿Requiere ficha técnica del producto?"
                value={ficha.requiereFicha}
                onChange={(event) =>
                  patchFicha(form, onChange, { requiereFicha: event.target.value })
                }
                options={SI_NO_OPTIONS}
                disabled={disabled}
                compact
              />
              <PolariaFormField
                id={`${idPrefix}-devol`}
                label="Política de rechazo y devolución"
                compact
                className="sm:col-span-3"
              >
                <textarea
                  id={`${idPrefix}-devol`}
                  value={ficha.politicaDevolucion}
                  placeholder="Qué pasa si el cliente rechaza producto al recibir"
                  onChange={(event) =>
                    patchFicha(form, onChange, {
                      politicaDevolucion: event.target.value,
                    })
                  }
                  disabled={disabled}
                  className={cn(POLARIA_FORM_INPUT_CLASS_COMPACT, "min-h-[4.5rem] resize-y")}
                />
              </PolariaFormField>
            </div>
          </StepShell>
  );
}
