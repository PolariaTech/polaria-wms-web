"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  POLARIA_FORM_INPUT_CLASS_COMPACT,
  POLARIA_FORM_SELECT_CLASS_COMPACT,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { cn } from "@/lib/utils/cn";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  listCatalogoProductosAdmin,
  type CatalogoProductoListRow,
} from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import { createCompradorProductoAliasAdmin } from "../services/comprador-producto-alias.service";
import { createCompradorAdmin } from "../services/compradores.service";
import {
  emptyAltaFormState,
  fichaFromAltaForm,
  type CompradorAltaFormState,
} from "../utils/comprador-alta";
import {
  AddRowButton,
  CompradorAltaFormFields,
  type CompradorAltaFormStep,
} from "./CompradorAltaFormFields";

interface CompradorCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface EquivalenciaDraft {
  key: string;
  aliasHotel: string;
  idProducto: string;
}

type WizardStepKey = Exclude<CompradorAltaFormStep, "all"> | "equivalencias";

interface WizardStep {
  key: WizardStepKey;
  title: string;
  description: string;
  optional?: boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    key: "fiscal",
    title: "Datos fiscales",
    description: "Se copian de la Constancia de Situación Fiscal.",
  },
  {
    key: "identificacion",
    title: "Identificación comercial",
    description: "Es el nombre y datos que verá el vendedor al capturar.",
  },
  {
    key: "condiciones",
    title: "Condiciones comerciales",
    description: "Llenan solas la sección fiscal del pedido.",
  },
  {
    key: "centros",
    title: "Centros de consumo y entrega",
    description: "Uno por cocina — el pedido los ofrece en lista.",
  },
  {
    key: "contactos",
    title: "Contactos",
    description: "Quien pide y quien recibe casi nunca son la misma persona.",
  },
  {
    key: "canales",
    title: "Canales de pedido",
    description: "Desde dónde llegan los pedidos de este hotel.",
  },
  {
    key: "reglas",
    title: "Reglas de operación",
    description: "Lo que el almacén necesita saber a las 3 AM.",
  },
  {
    key: "equivalencias",
    title: "Equivalencias de producto",
    description: "Opcional — cómo le dice este hotel a cada producto del catálogo.",
    optional: true,
  },
];

const LAST_STEP_INDEX = WIZARD_STEPS.length - 1;

function newKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyEquivalencia(): EquivalenciaDraft {
  return { key: newKey(), aliasHotel: "", idProducto: "" };
}

function WizardProgress({
  stepIndex,
  total,
}: {
  stepIndex: number;
  total: number;
}) {
  const progress = ((stepIndex + 1) / total) * 100;

  return (
    <div className="mb-1 space-y-2">
      <div className="flex items-center justify-between gap-3 polaria-text-caption text-polaria-w-50">
        <span>
          Paso {stepIndex + 1} de {total}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-polaria-w-08"
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Paso ${stepIndex + 1} de ${total}`}
      >
        <div
          className="h-full rounded-full bg-polaria-teal transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function CompradorCreateModal({
  open,
  onClose,
  onCreated,
}: CompradorCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const vendedorNombre = useAuthStore((state) => state.session?.nombre?.trim() ?? "");

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<CompradorAltaFormState>(() =>
    emptyAltaFormState(vendedorNombre),
  );
  const [equivalencias, setEquivalencias] = useState<EquivalenciaDraft[]>([
    emptyEquivalencia(),
  ]);
  const [productos, setProductos] = useState<CatalogoProductoListRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = WIZARD_STEPS[stepIndex];
  const isLastStep = stepIndex === LAST_STEP_INDEX;
  const isFirstStep = stepIndex === 0;

  useEffect(() => {
    if (!open) return;

    setStepIndex(0);
    setForm(emptyAltaFormState(vendedorNombre));
    setEquivalencias([emptyEquivalencia()]);
    setProductos([]);
    setError(null);
    setIsSubmitting(false);

    if (!codigoCuenta) return;

    void listCatalogoProductosAdmin({ codigoCuenta, limit: 500 })
      .then(setProductos)
      .catch(() => {
        setProductos([]);
      });
  }, [codigoCuenta, open, vendedorNombre]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const validateCurrentStep = (): string | null => {
    if (currentStep.key !== "identificacion") return null;

    const nombre =
      form.nombreComercial.trim() || form.ficha.razonSocial.trim();
    if (!nombre) {
      return "Indica el nombre comercial del comprador.";
    }

    const telefono = form.telefono.trim();
    if (telefono && !isValidInternationalPhone(telefono)) {
      return "Ingresa un número de teléfono válido.";
    }

    return null;
  };

  const goNext = () => {
    setError(null);
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, LAST_STEP_INDEX));
  };

  const goBack = () => {
    setError(null);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
    skipEquivalencias = false,
  ) => {
    event.preventDefault();
    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    const ficha = {
      ...fichaFromAltaForm(form),
      vendedor: vendedorNombre,
    };
    const nombre = form.nombreComercial.trim() || ficha.razonSocial.trim();
    if (!nombre) {
      setError("Falta el nombre comercial.");
      setStepIndex(
        WIZARD_STEPS.findIndex((step) => step.key === "identificacion"),
      );
      return;
    }

    const telefonoPrincipal = form.telefono.trim();
    const telefonoContacto = ficha.contactos
      .map((row) => row.telefono.trim())
      .find((value) => value && isValidInternationalPhone(value));
    const telefonoGuardar = telefonoPrincipal || telefonoContacto || "";

    if (telefonoPrincipal && !isValidInternationalPhone(telefonoPrincipal)) {
      setError("Ingresa un número de teléfono válido.");
      setStepIndex(
        WIZARD_STEPS.findIndex((step) => step.key === "identificacion"),
      );
      return;
    }

    const aliases = skipEquivalencias
      ? []
      : equivalencias.filter((row) => row.aliasHotel.trim() && row.idProducto);
    const seenProductos = new Set<string>();
    const uniqueAliases = aliases.filter((row) => {
      if (seenProductos.has(row.idProducto)) return false;
      seenProductos.add(row.idProducto);
      return true;
    });

    setIsSubmitting(true);

    try {
      const created = await createCompradorAdmin({
        codigoCuenta,
        nombre,
        telefono: telefonoGuardar,
        ficha,
      });

      for (const row of uniqueAliases) {
        await createCompradorProductoAliasAdmin({
          codigoCuenta,
          idComprador: created.idComprador,
          idProducto: row.idProducto,
          alias: row.aliasHotel,
        });
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear el comprador.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerAction = (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      {!isFirstStep ? (
        <button
          type="button"
          onClick={goBack}
          disabled={isSubmitting}
          className={cn(
            "rounded-xl border border-polaria-w-08 px-4 py-2.5",
            "polaria-text-body-sm text-polaria-w transition hover:border-polaria-t-20 hover:text-polaria-teal",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
          )}
        >
          Anterior
        </button>
      ) : null}

      {isLastStep ? (
        <>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(event) => {
              void handleSubmit(
                event as unknown as FormEvent<HTMLFormElement>,
                true,
              );
            }}
            className={cn(
              "rounded-xl border border-polaria-w-08 px-4 py-2.5",
              "polaria-text-body-sm text-polaria-w transition hover:border-polaria-t-20 hover:text-polaria-teal",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
            )}
          >
            Omitir y guardar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-2.5",
              "polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Guardar comprador
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={goNext}
          disabled={isSubmitting}
          className={cn(
            "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-2.5",
            "polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
          )}
        >
          Siguiente
        </button>
      )}
    </div>
  );

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nuevo comprador"
      title={currentStep.title}
      description={currentStep.description}
      onSubmit={(event) => {
        if (isLastStep) {
          void handleSubmit(event, false);
        } else {
          event.preventDefault();
          goNext();
        }
      }}
      error={error}
      isSubmitting={isSubmitting}
      compact
      size="2xl"
      hideHeaderClose
      footerAction={footerAction}
    >
      <WizardProgress stepIndex={stepIndex} total={WIZARD_STEPS.length} />

      {currentStep.key !== "equivalencias" ? (
        <CompradorAltaFormFields
          form={form}
          onChange={setForm}
          disabled={isSubmitting}
          idPrefix="comprador"
          codigoValue="Se genera al guardar"
          nombreAutoFocus={currentStep.key === "identificacion"}
          step={currentStep.key}
        />
      ) : (
        <div className="space-y-3">
          <p className="polaria-text-body-sm text-polaria-w-50">
            Si el hotel usa nombres distintos para los productos, puedes mapearlos
            aquí. También puedes omitir este paso y agregarlos después.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-polaria-t-20">
                  <th className="w-[42%] pb-2 polaria-text-caption font-medium text-polaria-w-50">
                    Como lo escribe el hotel
                  </th>
                  <th className="w-[50%] pb-2 polaria-text-caption font-medium text-polaria-w-50">
                    Producto del catálogo
                  </th>
                  <th className="w-[8%] pb-2">
                    <span className="sr-only">Quitar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {equivalencias.map((row, index) => (
                  <tr
                    key={row.key}
                    className="border-b border-polaria-w-08 last:border-b-0"
                  >
                    <td className="py-2 pr-2 align-top">
                      <input
                        aria-label="Como lo escribe el hotel"
                        value={row.aliasHotel}
                        placeholder="fresa chica"
                        onChange={(event) =>
                          setEquivalencias((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, aliasHotel: event.target.value }
                                : item,
                            ),
                          )
                        }
                        disabled={isSubmitting}
                        className={POLARIA_FORM_INPUT_CLASS_COMPACT}
                      />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <select
                        aria-label="Producto del catálogo"
                        value={row.idProducto}
                        onChange={(event) =>
                          setEquivalencias((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, idProducto: event.target.value }
                                : item,
                            ),
                          )
                        }
                        disabled={isSubmitting}
                        className={POLARIA_FORM_SELECT_CLASS_COMPACT}
                      >
                        <option value="">—</option>
                        {productos.map((producto) => (
                          <option
                            key={producto.idProducto}
                            value={producto.idProducto}
                          >
                            {producto.codigo} ·{" "}
                            {producto.titulo || producto.descripcion}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 align-top text-right">
                      {equivalencias.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setEquivalencias((prev) =>
                              prev.filter((item) => item.key !== row.key),
                            )
                          }
                          className="rounded-lg p-2 text-polaria-w-50 transition hover:bg-polaria-w-08 hover:text-polaria-danger"
                          aria-label="Quitar equivalencia"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AddRowButton
            label="Agregar equivalencia"
            disabled={isSubmitting}
            onClick={() =>
              setEquivalencias((prev) => [...prev, emptyEquivalencia()])
            }
          />
        </div>
      )}
    </PolariaFormModal>
  );
}
