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

export function CompradorAltaFormContactosSection(props: CompradorAltaSectionProps) {
  const { show, bare, form, onChange, disabled, idPrefix } = props;
  const { ficha } = form;
  return (
    <StepShell
            show={show}
            bare={bare}
            title="Contactos"
            optional="Quien pide y quien recibe casi nunca son la misma persona"
          >
            {ficha.contactos.map((contacto, index) => (
              <div
                key={contacto.key}
                className="relative mb-3 rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-3"
              >
                {ficha.contactos.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      patchFicha(form, onChange, {
                        contactos: ficha.contactos.filter(
                          (row) => row.key !== contacto.key,
                        ),
                      })
                    }
                    disabled={disabled}
                    className="absolute right-2 top-2 rounded-lg p-1.5 text-polaria-w-50 transition hover:bg-polaria-t-08 hover:text-polaria-danger disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Quitar contacto"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
                <div className="grid grid-cols-1 gap-3 pr-8 sm:grid-cols-3">
                  <PolariaFormInput
                    id={`${idPrefix}-contacto-nombre-${contacto.key}`}
                    label="Nombre"
                    value={contacto.nombre}
                    onChange={(event) =>
                      patchContacto(form, onChange, index, {
                        nombre: event.target.value,
                      })
                    }
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-contacto-puesto-${contacto.key}`}
                    label="Puesto"
                    value={contacto.puesto}
                    placeholder="Chef ejecutivo"
                    onChange={(event) =>
                      patchContacto(form, onChange, index, {
                        puesto: event.target.value,
                      })
                    }
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormSelect
                    id={`${idPrefix}-contacto-rol-${contacto.key}`}
                    label="Rol"
                    value={contacto.rol}
                    onChange={(event) =>
                      patchContacto(form, onChange, index, { rol: event.target.value })
                    }
                    options={ROL_CONTACTO_OPTIONS}
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-contacto-tel-${contacto.key}`}
                    label="Teléfono"
                    type="tel"
                    value={contacto.telefono}
                    onChange={(event) =>
                      patchContacto(form, onChange, index, {
                        telefono: event.target.value,
                      })
                    }
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-contacto-correo-${contacto.key}`}
                    label="Correo"
                    value={contacto.correo}
                    onChange={(event) =>
                      patchContacto(form, onChange, index, {
                        correo: event.target.value,
                      })
                    }
                    disabled={disabled}
                    compact
                    fieldClassName="sm:col-span-2"
                  />
                </div>
              </div>
            ))}
            <AddRowButton
              label="Agregar contacto"
              disabled={disabled}
              onClick={() =>
                patchFicha(form, onChange, {
                  contactos: [...ficha.contactos, emptyAltaContactoRow()],
                })
              }
            />
          </StepShell>
  );
}
