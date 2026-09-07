"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
  PolariaFormSelect,
  POLARIA_FORM_INPUT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import { cn } from "@/lib/utils/cn";
import {
  emptyAltaCentroRow,
  emptyAltaContactoRow,
  type CompradorAltaCentroRow,
  type CompradorAltaContactoRow,
  type CompradorAltaFormFicha,
  type CompradorAltaFormState,
} from "../utils/comprador-alta";

const REGIMEN_OPTIONS = [
  { value: "", label: "—" },
  { value: "601 — General de ley personas morales", label: "601 — General de ley personas morales" },
  { value: "612 — Personas físicas con actividad empresarial", label: "612 — Personas físicas con actividad empresarial" },
  { value: "626 — RESICO", label: "626 — RESICO" },
  { value: "616 — Sin obligaciones fiscales", label: "616 — Sin obligaciones fiscales" },
];

const USO_CFDI_OPTIONS = [
  { value: "G01 — Adquisición de mercancías", label: "G01 — Adquisición de mercancías" },
  { value: "G03 — Gastos en general", label: "G03 — Gastos en general" },
  { value: "S01 — Sin efectos fiscales", label: "S01 — Sin efectos fiscales" },
];

const ESTADO_OPTIONS = [
  { value: "Activo", label: "Activo" },
  { value: "Suspendido por cartera", label: "Suspendido por cartera" },
  { value: "Prospecto", label: "Prospecto" },
];

const METODO_PAGO_OPTIONS = [
  { value: "PPD — Parcialidades o diferido", label: "PPD — Parcialidades o diferido" },
  { value: "PUE — Una sola exhibición", label: "PUE — Una sola exhibición" },
];

const FORMA_PAGO_OPTIONS = [
  { value: "03 — Transferencia electrónica", label: "03 — Transferencia electrónica" },
  { value: "01 — Efectivo", label: "01 — Efectivo" },
  { value: "99 — Por definir", label: "99 — Por definir" },
];

const SI_NO_OPTIONS = [
  { value: "Sí", label: "Sí" },
  { value: "No", label: "No" },
];

const SUSTITUCIONES_OPTIONS = [
  { value: "No — surtir parcial", label: "No — surtir parcial" },
  { value: "Sí, avisando antes", label: "Sí, avisando antes" },
  { value: "Sí, a criterio de almacén", label: "Sí, a criterio de almacén" },
];

const TOLERANCIA_OPTIONS = [
  { value: "", label: "Sin definir" },
  { value: "± 2%", label: "± 2%" },
  { value: "± 5%", label: "± 5%" },
  { value: "± 10%", label: "± 10%" },
];

const FORMATO_PEDIDO_OPTIONS = [
  { value: "Texto libre", label: "Texto libre" },
  { value: "Orden de compra en PDF", label: "Orden de compra en PDF" },
  { value: "Excel", label: "Excel" },
  { value: "Mezclado", label: "Mezclado" },
];

const ROL_CONTACTO_OPTIONS = [
  { value: "Hace pedidos", label: "Hace pedidos" },
  { value: "Recibe mercancía", label: "Recibe mercancía" },
  { value: "Autoriza", label: "Autoriza" },
  { value: "Paga", label: "Paga" },
];

const CARRETERA_OPTIONS = [
  { value: "No — entrega urbana local", label: "No — entrega urbana local" },
  { value: "Sí — más de 30 km en tramo federal", label: "Sí — más de 30 km en tramo federal" },
];

export function CaptureSection({
  title,
  optional,
  children,
}: {
  title: string;
  optional?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <h3 className="flex items-center justify-between gap-3 border-b border-polaria-w-08 px-4 py-2.5 polaria-text-label uppercase tracking-wide text-polaria-teal">
        <span>{title}</span>
        {optional ? (
          <span className="normal-case tracking-normal text-polaria-w-50">
            {optional}
          </span>
        ) : null}
      </h3>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function AddRowButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "mt-3 inline-flex items-center gap-1 rounded-xl border border-polaria-teal px-4 py-2",
        "polaria-text-body-sm font-semibold text-polaria-teal transition hover:bg-polaria-t-08",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <Plus className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

export type CompradorAltaFormStep =
  | "all"
  | "fiscal"
  | "identificacion"
  | "condiciones"
  | "centros"
  | "contactos"
  | "canales"
  | "reglas";

interface CompradorAltaFormFieldsProps {
  form: CompradorAltaFormState;
  onChange: (next: CompradorAltaFormState) => void;
  disabled?: boolean;
  idPrefix: string;
  codigoValue: string;
  nombreAutoFocus?: boolean;
  /** Si se indica, solo muestra la sección del paso (wizard). */
  step?: CompradorAltaFormStep;
}

function patchFicha(
  form: CompradorAltaFormState,
  onChange: (next: CompradorAltaFormState) => void,
  patch: Partial<CompradorAltaFormFicha>,
) {
  onChange({ ...form, ficha: { ...form.ficha, ...patch } });
}

function patchCentro(
  form: CompradorAltaFormState,
  onChange: (next: CompradorAltaFormState) => void,
  index: number,
  patch: Partial<CompradorAltaCentroRow>,
) {
  patchFicha(form, onChange, {
    centros: form.ficha.centros.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    ),
  });
}

function patchContacto(
  form: CompradorAltaFormState,
  onChange: (next: CompradorAltaFormState) => void,
  index: number,
  patch: Partial<CompradorAltaContactoRow>,
) {
  patchFicha(form, onChange, {
    contactos: form.ficha.contactos.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    ),
  });
}

function StepShell({
  show,
  bare,
  title,
  optional,
  children,
}: {
  show: boolean;
  bare: boolean;
  title: string;
  optional?: string;
  children: ReactNode;
}) {
  if (!show) return null;
  if (bare) {
    return <div className="space-y-3">{children}</div>;
  }
  return (
    <CaptureSection title={title} optional={optional}>
      {children}
    </CaptureSection>
  );
}

export function CompradorAltaFormFields({
  form,
  onChange,
  disabled,
  idPrefix,
  codigoValue,
  nombreAutoFocus,
  step = "all",
}: CompradorAltaFormFieldsProps) {
  const { ficha } = form;
  const bare = step !== "all";
  const show = (section: Exclude<CompradorAltaFormStep, "all">) =>
    step === "all" || step === section;

  return (
    <>
      <StepShell
        show={show("fiscal")}
        bare={bare}
        title="Datos fiscales"
        optional="Se copian de la Constancia de Situación Fiscal"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PolariaFormInput
            id={`${idPrefix}-razon`}
            label="Razón social"
            value={ficha.razonSocial}
            placeholder="Tal cual aparece en la constancia"
            onChange={(event) =>
              patchFicha(form, onChange, { razonSocial: event.target.value })
            }
            disabled={disabled}
            compact
            fieldClassName="sm:col-span-2"
          />
          <PolariaFormInput
            id={`${idPrefix}-rfc`}
            label="RFC"
            value={ficha.rfc}
            maxLength={13}
            onChange={(event) =>
              patchFicha(form, onChange, { rfc: event.target.value.toUpperCase() })
            }
            disabled={disabled}
            compact
          />
          <PolariaFormSelect
            id={`${idPrefix}-regimen`}
            label="Régimen fiscal"
            value={ficha.regimen}
            onChange={(event) =>
              patchFicha(form, onChange, { regimen: event.target.value })
            }
            options={REGIMEN_OPTIONS}
            disabled={disabled}
            compact
          />
          <PolariaFormInput
            id={`${idPrefix}-cp-fiscal`}
            label="CP del domicilio fiscal"
            value={ficha.cpFiscal}
            maxLength={5}
            onChange={(event) =>
              patchFicha(form, onChange, { cpFiscal: event.target.value })
            }
            disabled={disabled}
            compact
          />
          <PolariaFormSelect
            id={`${idPrefix}-uso-cfdi`}
            label="Uso del CFDI por omisión"
            value={ficha.usoCfdi}
            onChange={(event) =>
              patchFicha(form, onChange, { usoCfdi: event.target.value })
            }
            options={USO_CFDI_OPTIONS}
            disabled={disabled}
            compact
          />
          <PolariaFormField
            id={`${idPrefix}-csf`}
            label="Constancia de Situación Fiscal"
            compact
            className="sm:col-span-2"
          >
            <label
              htmlFor={`${idPrefix}-csf`}
              className={cn(
                "block cursor-pointer rounded-xl border border-dashed border-polaria-t-20 bg-polaria-w-08 px-4 py-3 text-center",
                "polaria-text-body-sm text-polaria-w-50 transition hover:border-polaria-teal hover:text-polaria-teal",
              )}
            >
              Adjuntar PDF de la constancia
              <input
                id={`${idPrefix}-csf`}
                type="file"
                accept="application/pdf"
                className="sr-only"
                disabled={disabled}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  patchFicha(form, onChange, { constanciaNombre: file?.name ?? "" });
                }}
              />
            </label>
            {ficha.constanciaNombre ? (
              <p className="mt-2 font-mono polaria-text-caption text-polaria-w">
                {ficha.constanciaNombre}
              </p>
            ) : null}
          </PolariaFormField>
          <PolariaFormInput
            id={`${idPrefix}-csf-fecha`}
            label="Fecha de la constancia"
            type="date"
            value={ficha.constanciaFecha}
            onChange={(event) =>
              patchFicha(form, onChange, { constanciaFecha: event.target.value })
            }
            disabled={disabled}
            compact
          />
        </div>
      </StepShell>

      <StepShell
        show={show("identificacion")}
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
            placeholder="Hotel Xcaret"
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
            label="Apodo interno"
            value={ficha.apodo}
            placeholder="El Güero"
            onChange={(event) =>
              patchFicha(form, onChange, { apodo: event.target.value })
            }
            disabled={disabled}
            compact
          />
          <PolariaFormInput
            id={`${idPrefix}-grupo`}
            label="Grupo hotelero"
            value={ficha.grupo}
            onChange={(event) =>
              patchFicha(form, onChange, { grupo: event.target.value })
            }
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

      <StepShell
        show={show("condiciones")}
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
            placeholder="cuentasporpagar@hotel.com, compras@hotel.com"
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
              El hotel requiere complemento de pago por cada abono recibido
            </span>
          </label>
        </div>
      </StepShell>

      <StepShell
        show={show("centros")}
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

      <StepShell
        show={show("contactos")}
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

      <StepShell
        show={show("canales")}
        bare={bare}
        title="Canales de pedido"
        optional="Desde dónde llegan los pedidos de este hotel"
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
            placeholder="chef@hotel.com, almacen@hotel.com"
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
              El hotel opera un portal de proveedores con sus propios requisitos y
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

      <StepShell
        show={show("reglas")}
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
              placeholder="Qué pasa si el hotel rechaza producto al recibir"
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
    </>
  );
}
