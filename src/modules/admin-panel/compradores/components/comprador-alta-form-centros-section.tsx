"use client";

import { Trash2 } from "lucide-react";
import { PolariaFormInput, PolariaFormSelect } from "@/components/shared/form/PolariaFormField";
import { emptyAltaCentroRow, type CompradorAltaFormState } from "../utils/comprador-alta";
import { CARRETERA_OPTIONS } from "./comprador-alta-form-options";
import { AddRowButton, StepShell, patchCentro, patchFicha } from "./comprador-alta-form-shared";

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

export function CompradorAltaFormCentrosSection(props: CompradorAltaSectionProps) {
  const { show, bare, form, onChange, disabled, idPrefix } = props;
  const { ficha } = form;
  return (
    <StepShell
            show={show}
            bare={bare}
            title="Centros de consumo y entrega"
            optional="Uno por cocina — el pedido los ofrece en lista"
          >
            {ficha.centros.map((centro, index) => (
              <div
                key={centro.key}
                className="relative mb-3 rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-3"
              >
                {ficha.centros.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      patchFicha(form, onChange, {
                        centros: ficha.centros.filter((row) => row.key !== centro.key),
                      })
                    }
                    disabled={disabled}
                    className="absolute right-2 top-2 rounded-lg p-1.5 text-polaria-w-50 transition hover:bg-polaria-t-08 hover:text-polaria-danger disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Quitar centro de consumo"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
                <div className="grid grid-cols-1 gap-3 pr-8 sm:grid-cols-3">
                  <PolariaFormInput
                    id={`${idPrefix}-centro-nombre-${centro.key}`}
                    label="Nombre del centro de consumo"
                    value={centro.nombre}
                    placeholder="Cocina de banquetes"
                    onChange={(event) =>
                      patchCentro(form, onChange, index, { nombre: event.target.value })
                    }
                    disabled={disabled}
                    compact
                    fieldClassName="sm:col-span-2"
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-centro-dias-${centro.key}`}
                    label="Días que recibe"
                    value={centro.dias}
                    placeholder="Lun a Sáb"
                    onChange={(event) =>
                      patchCentro(form, onChange, index, { dias: event.target.value })
                    }
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-centro-dir-${centro.key}`}
                    label="Dirección"
                    value={centro.direccion}
                    onChange={(event) =>
                      patchCentro(form, onChange, index, {
                        direccion: event.target.value,
                      })
                    }
                    disabled={disabled}
                    compact
                    fieldClassName="sm:col-span-2"
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-centro-cp-${centro.key}`}
                    label="CP"
                    value={centro.cp}
                    maxLength={5}
                    onChange={(event) =>
                      patchCentro(form, onChange, index, { cp: event.target.value })
                    }
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-centro-anden-${centro.key}`}
                    label="Andén / punto de recepción"
                    value={centro.anden}
                    placeholder="Andén 3 — alimentos"
                    onChange={(event) =>
                      patchCentro(form, onChange, index, { anden: event.target.value })
                    }
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-centro-desde-${centro.key}`}
                    label="Recibe desde"
                    type="time"
                    value={centro.desde}
                    onChange={(event) =>
                      patchCentro(form, onChange, index, { desde: event.target.value })
                    }
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-centro-hasta-${centro.key}`}
                    label="Recibe hasta"
                    type="time"
                    value={centro.hasta}
                    onChange={(event) =>
                      patchCentro(form, onChange, index, { hasta: event.target.value })
                    }
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-centro-contacto-${centro.key}`}
                    label="Contacto en el andén"
                    value={centro.contacto}
                    onChange={(event) =>
                      patchCentro(form, onChange, index, {
                        contacto: event.target.value,
                      })
                    }
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-centro-tel-${centro.key}`}
                    label="Teléfono del andén"
                    type="tel"
                    value={centro.telefono}
                    onChange={(event) =>
                      patchCentro(form, onChange, index, {
                        telefono: event.target.value,
                      })
                    }
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormSelect
                    id={`${idPrefix}-centro-carretera-${centro.key}`}
                    label="¿La ruta usa carretera federal?"
                    value={centro.carreteraFederal}
                    onChange={(event) =>
                      patchCentro(form, onChange, index, {
                        carreteraFederal: event.target.value,
                      })
                    }
                    options={CARRETERA_OPTIONS}
                    disabled={disabled}
                    compact
                  />
                  <PolariaFormInput
                    id={`${idPrefix}-centro-notas-${centro.key}`}
                    label="Notas de acceso"
                    value={centro.notas}
                    placeholder="Entrada de servicio por la parte trasera"
                    onChange={(event) =>
                      patchCentro(form, onChange, index, { notas: event.target.value })
                    }
                    disabled={disabled}
                    compact
                    fieldClassName="sm:col-span-3"
                  />
                </div>
              </div>
            ))}
            <AddRowButton
              label="Agregar centro de consumo"
              disabled={disabled}
              onClick={() =>
                patchFicha(form, onChange, {
                  centros: [...ficha.centros, emptyAltaCentroRow()],
                })
              }
            />
          </StepShell>
  );
}
