"use client";

import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { PolariaFormInput } from "@/components/shared/PolariaFormField";
import { WmsRol } from "@/constants/roles";
import { ROUTES } from "@/config/routes";
import { WMS_ROL_LABELS } from "@/constants/wms-roles";
import { DomainServiceError } from "@/lib/domain-service-error";
import {
  generateCodigoCuentaFromNombre,
  normalizeCodigoCuentaInput,
} from "@/lib/generate-codigo-cuenta";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/auth.store";
import {
  ONBOARDING_PAGE_SUBTITLE,
  ONBOARDING_PAGE_TITLE,
  ONBOARDING_STEPS,
  ONBOARDING_SUMMARY_SUBTITLE,
  ONBOARDING_SUMMARY_TITLE,
} from "../constants/onboarding";
import { createBodegaInternaConfigurator } from "../services/bodegas-internas.service";
import { createCuentaConfigurator } from "../services/cuentas.service";
import { createEmpresaConfigurator } from "../services/empresas.service";
import { createUsuarioConfigurator } from "../services/usuarios.service";

const SUMMARY_STEP_INDEX = ONBOARDING_STEPS.length;

interface EmpresaFormState {
  razonSocial: string;
  codigoEmpresa: string;
}

interface CuentaFormState {
  nombreComercial: string;
  codigoCuenta: string;
}

interface BodegaFormState {
  nombre: string;
  capacidad: string;
}

interface AdminFormState {
  nombre: string;
  correo: string;
  clave: string;
}

interface OnboardingCreatedState {
  razonSocial: string;
  codigoEmpresa: string;
  nombreComercial: string;
  codigoCuenta: string;
  nombreBodega: string;
  idBodega: string;
  adminNombre: string;
  adminCorreo: string;
}

const INITIAL_EMPRESA_FORM: EmpresaFormState = {
  razonSocial: "",
  codigoEmpresa: "",
};

const INITIAL_CUENTA_FORM: CuentaFormState = {
  nombreComercial: "",
  codigoCuenta: "",
};

const INITIAL_BODEGA_FORM: BodegaFormState = {
  nombre: "",
  capacidad: "",
};

const INITIAL_ADMIN_FORM: AdminFormState = {
  nombre: "",
  correo: "",
  clave: "",
};

function StepProgress({
  currentStep,
  completedSteps,
}: {
  currentStep: number;
  completedSteps: boolean[];
}) {
  return (
    <ol
      aria-label="Progreso del onboarding"
      className="flex flex-wrap items-center gap-2 sm:gap-3"
    >
      {ONBOARDING_STEPS.map((step, index) => {
        const isComplete = completedSteps[index];
        const isCurrent = currentStep === index;
        const isPast = index < currentStep || isComplete;

        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-3">
            {index > 0 ? (
              <span
                aria-hidden
                className={cn(
                  "hidden h-px w-6 sm:block sm:w-10",
                  isPast ? "bg-polaria-teal" : "bg-polaria-w-08",
                )}
              />
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 polaria-text-badge",
                isCurrent
                  ? "border-polaria-teal bg-polaria-t-08 text-polaria-teal"
                  : isComplete
                    ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-w"
                    : "border-polaria-w-08 bg-polaria-t-08 text-polaria-w-50",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full polaria-text-badge",
                  isComplete
                    ? "bg-polaria-teal text-polaria-bg"
                    : isCurrent
                      ? "border border-polaria-teal text-polaria-teal"
                      : "border border-polaria-w-20 text-polaria-w-50",
                )}
                aria-hidden
              >
                {isComplete ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
              </span>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-polaria-w-08 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="polaria-text-body-sm text-polaria-w-50">{label}</span>
      <span className="polaria-text-body font-medium text-polaria-w">{value}</span>
    </div>
  );
}

export function OnboardingWizard() {
  const idCreador = useAuthStore((state) => state.session?.idUsuario ?? null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([
    false,
    false,
    false,
    false,
  ]);
  const [empresaForm, setEmpresaForm] = useState(INITIAL_EMPRESA_FORM);
  const [cuentaForm, setCuentaForm] = useState(INITIAL_CUENTA_FORM);
  const [bodegaForm, setBodegaForm] = useState(INITIAL_BODEGA_FORM);
  const [adminForm, setAdminForm] = useState(INITIAL_ADMIN_FORM);
  const [empresaCodigoManual, setEmpresaCodigoManual] = useState(false);
  const [cuentaCodigoManual, setCuentaCodigoManual] = useState(false);
  const [created, setCreated] = useState<OnboardingCreatedState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSummary = currentStep >= SUMMARY_STEP_INDEX;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const empresaLabel = useMemo(() => {
    if (!empresaForm.razonSocial) return "";
    return `${empresaForm.razonSocial} (${empresaForm.codigoEmpresa})`;
  }, [empresaForm.codigoEmpresa, empresaForm.razonSocial]);

  const cuentaLabel = useMemo(() => {
    if (!cuentaForm.nombreComercial) return "";
    return `${cuentaForm.nombreComercial} (${cuentaForm.codigoCuenta})`;
  }, [cuentaForm.codigoCuenta, cuentaForm.nombreComercial]);

  const handleEmpresaRazonSocialChange = (value: string) => {
    setEmpresaForm((current) => ({
      ...current,
      razonSocial: value,
      codigoEmpresa: empresaCodigoManual
        ? current.codigoEmpresa
        : generateCodigoCuentaFromNombre(value),
    }));
  };

  const handleEmpresaCodigoChange = (value: string) => {
    setEmpresaCodigoManual(true);
    setEmpresaForm((current) => ({
      ...current,
      codigoEmpresa: normalizeCodigoCuentaInput(value),
    }));
  };

  const handleCuentaNombreChange = (value: string) => {
    setCuentaForm((current) => ({
      ...current,
      nombreComercial: value,
      codigoCuenta: cuentaCodigoManual
        ? current.codigoCuenta
        : generateCodigoCuentaFromNombre(value),
    }));
  };

  const handleCuentaCodigoChange = (value: string) => {
    setCuentaCodigoManual(true);
    setCuentaForm((current) => ({
      ...current,
      codigoCuenta: normalizeCodigoCuentaInput(value),
    }));
  };

  const submitCurrentStep = useCallback(async (): Promise<boolean> => {
    if (completedSteps[currentStep]) {
      return true;
    }

    switch (currentStep) {
      case 0: {
        const result = await createEmpresaConfigurator({
          razonSocial: empresaForm.razonSocial,
          codigoEmpresa: empresaForm.codigoEmpresa,
          idCreador,
        });
        setEmpresaForm({
          razonSocial: result.razonSocial,
          codigoEmpresa: result.codigoEmpresa,
        });
        setCreated((current) => ({
          ...(current ?? {
            nombreComercial: "",
            codigoCuenta: "",
            nombreBodega: "",
            idBodega: "",
            adminNombre: "",
            adminCorreo: "",
          }),
          razonSocial: result.razonSocial,
          codigoEmpresa: result.codigoEmpresa,
        }));
        return true;
      }
      case 1: {
        const result = await createCuentaConfigurator({
          nombreComercial: cuentaForm.nombreComercial,
          codigoCuenta: cuentaForm.codigoCuenta,
          codigoEmpresa: empresaForm.codigoEmpresa,
          idCreador,
        });
        setCuentaForm({
          nombreComercial: result.nombreComercial,
          codigoCuenta: result.codigoCuenta,
        });
        setCreated((current) => ({
          ...(current as OnboardingCreatedState),
          nombreComercial: result.nombreComercial,
          codigoCuenta: result.codigoCuenta,
        }));
        return true;
      }
      case 2: {
        const result = await createBodegaInternaConfigurator({
          nombre: bodegaForm.nombre,
          capacidad: Number(bodegaForm.capacidad),
          codigoCuenta: cuentaForm.codigoCuenta,
          idCreador,
        });
        setBodegaForm({
          nombre: result.nombre,
          capacidad: String(result.capacidad ?? ""),
        });
        setCreated((current) => ({
          ...(current as OnboardingCreatedState),
          nombreBodega: result.nombre,
          idBodega: result.idBodega,
        }));
        return true;
      }
      case 3: {
        const codigo = generateCodigoCuentaFromNombre(adminForm.nombre);
        const result = await createUsuarioConfigurator({
          codigo,
          nombre: adminForm.nombre,
          idRol: WmsRol.administrador_cuenta,
          codigoCuenta: cuentaForm.codigoCuenta,
          idBodega: null,
          correo: adminForm.correo,
          clave: adminForm.clave,
        });
        setCreated((current) => ({
          ...(current as OnboardingCreatedState),
          adminNombre: result.nombre,
          adminCorreo: adminForm.correo,
        }));
        return true;
      }
      default:
        return false;
    }
  }, [
    adminForm.clave,
    adminForm.correo,
    adminForm.nombre,
    bodegaForm.capacidad,
    bodegaForm.nombre,
    completedSteps,
    cuentaForm.codigoCuenta,
    cuentaForm.nombreComercial,
    currentStep,
    empresaForm.codigoEmpresa,
    empresaForm.razonSocial,
    idCreador,
  ]);

  const handleBack = () => {
    if (isSubmitting || currentStep === 0 || isSummary) return;
    setError(null);
    setCurrentStep((step) => step - 1);
  };

  const handleNext = async () => {
    if (isSubmitting || isSummary) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const success = await submitCurrentStep();
      if (!success) return;

      setCompletedSteps((steps) => {
        const next = [...steps];
        next[currentStep] = true;
        return next;
      });

      if (isLastStep) {
        setCurrentStep(SUMMARY_STEP_INDEX);
      } else {
        setCurrentStep((step) => step + 1);
      }
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo completar este paso.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepForm = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <PolariaFormInput
              id="onboarding-empresa-razon-social"
              label="Razón social"
              value={empresaForm.razonSocial}
              placeholder="Nombre legal de la empresa"
              onChange={(event) =>
                handleEmpresaRazonSocialChange(event.target.value)
              }
              disabled={isSubmitting || completedSteps[0]}
              autoFocus
            />
            <PolariaFormInput
              id="onboarding-empresa-codigo"
              label="Código empresa"
              value={empresaForm.codigoEmpresa}
              placeholder="Código generado"
              onChange={(event) => handleEmpresaCodigoChange(event.target.value)}
              disabled={isSubmitting || completedSteps[0]}
              hint="Se genera al escribir la razón social; puedes ajustarlo si lo necesitas."
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <PolariaFormInput
              id="onboarding-cuenta-empresa"
              label="Empresa"
              value={empresaLabel}
              readOnly
              disabled
            />
            <PolariaFormInput
              id="onboarding-cuenta-nombre"
              label="Nombre comercial"
              value={cuentaForm.nombreComercial}
              placeholder="Nombre de la cuenta"
              onChange={(event) => handleCuentaNombreChange(event.target.value)}
              disabled={isSubmitting || completedSteps[1]}
              autoFocus
            />
            <PolariaFormInput
              id="onboarding-cuenta-codigo"
              label="Código cuenta"
              value={cuentaForm.codigoCuenta}
              placeholder="Código generado"
              onChange={(event) => handleCuentaCodigoChange(event.target.value)}
              disabled={isSubmitting || completedSteps[1]}
              hint="Se genera al escribir el nombre comercial; puedes ajustarlo si lo necesitas."
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <PolariaFormInput
              id="onboarding-bodega-cuenta"
              label="Cuenta destino"
              value={cuentaLabel}
              readOnly
              disabled
            />
            <PolariaFormInput
              id="onboarding-bodega-nombre"
              label="Nombre"
              value={bodegaForm.nombre}
              placeholder="Nombre de la bodega"
              onChange={(event) =>
                setBodegaForm((current) => ({
                  ...current,
                  nombre: event.target.value,
                }))
              }
              disabled={isSubmitting || completedSteps[2]}
              autoFocus
            />
            <PolariaFormInput
              id="onboarding-bodega-capacidad"
              label="Capacidad"
              type="number"
              min={1}
              inputMode="numeric"
              value={bodegaForm.capacidad}
              placeholder="Capacidad en slots"
              onChange={(event) =>
                setBodegaForm((current) => ({
                  ...current,
                  capacidad: event.target.value,
                }))
              }
              disabled={isSubmitting || completedSteps[2]}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <PolariaFormInput
              id="onboarding-admin-rol"
              label="Rol"
              value={WMS_ROL_LABELS[WmsRol.administrador_cuenta]}
              readOnly
              disabled
            />
            <PolariaFormInput
              id="onboarding-admin-cuenta"
              label="Cuenta"
              value={cuentaLabel}
              readOnly
              disabled
            />
            <PolariaFormInput
              id="onboarding-admin-nombre"
              label="Nombre"
              value={adminForm.nombre}
              placeholder="Nombre completo"
              onChange={(event) =>
                setAdminForm((current) => ({
                  ...current,
                  nombre: event.target.value,
                }))
              }
              disabled={isSubmitting || completedSteps[3]}
              autoFocus
            />
            <PolariaFormInput
              id="onboarding-admin-correo"
              label="Correo"
              type="email"
              autoComplete="email"
              value={adminForm.correo}
              placeholder="correo@empresa.com"
              onChange={(event) =>
                setAdminForm((current) => ({
                  ...current,
                  correo: event.target.value,
                }))
              }
              disabled={isSubmitting || completedSteps[3]}
            />
            <PolariaFormInput
              id="onboarding-admin-clave"
              label="Clave"
              type="password"
              autoComplete="new-password"
              value={adminForm.clave}
              placeholder="Contraseña inicial"
              onChange={(event) =>
                setAdminForm((current) => ({
                  ...current,
                  clave: event.target.value,
                }))
              }
              disabled={isSubmitting || completedSteps[3]}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex flex-1 flex-col justify-start gap-8 pt-8 pb-10 sm:gap-10 sm:pt-12 sm:pb-14 lg:gap-12 lg:pt-16 lg:pb-20">
      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <p className="polaria-text-label text-polaria-teal">Onboarding</p>
        <h1 className="polaria-text-display mt-2">{ONBOARDING_PAGE_TITLE}</h1>
        <p className="polaria-text-subtitle mt-3 text-polaria-w-50">
          {ONBOARDING_PAGE_SUBTITLE}
        </p>
      </section>

      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        {!isSummary ? (
          <div className="mb-6">
            <StepProgress
              currentStep={currentStep}
              completedSteps={completedSteps}
            />
          </div>
        ) : null}

        <section
          className={cn(
            "overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-sm",
            isSummary ? "p-6 sm:p-8" : "p-5 sm:p-6",
          )}
        >
          {isSummary && created ? (
            <div>
              <h2 className="polaria-text-card-title text-polaria-w">
                {ONBOARDING_SUMMARY_TITLE}
              </h2>
              <p className="polaria-text-body-sm mt-2 text-polaria-w-50">
                {ONBOARDING_SUMMARY_SUBTITLE}
              </p>

              <div className="mt-6">
                <SummaryRow
                  label="Empresa"
                  value={`${created.razonSocial} (${created.codigoEmpresa})`}
                />
                <SummaryRow
                  label="Cuenta comercial"
                  value={`${created.nombreComercial} (${created.codigoCuenta})`}
                />
                <SummaryRow
                  label="Bodega interna"
                  value={`${created.nombreBodega} (${created.idBodega.slice(0, 8).toUpperCase()})`}
                />
                <SummaryRow
                  label="Administrador de cuenta"
                  value={`${created.adminNombre} · ${created.adminCorreo}`}
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={ROUTES.configuratorCreationAccounts}
                  className="inline-flex items-center justify-center rounded-xl border border-polaria-t-20 bg-polaria-bg px-4 py-3 polaria-text-body-sm font-semibold text-polaria-w transition hover:border-polaria-teal hover:text-polaria-teal"
                >
                  Ver cuentas
                </Link>
                <Link
                  href={ROUTES.configuratorAssignmentUsers}
                  className="inline-flex items-center justify-center rounded-xl bg-polaria-teal px-4 py-3 polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90"
                >
                  Ver usuarios
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h2 className="polaria-text-card-title text-polaria-w">
                Paso {currentStep + 1}: {ONBOARDING_STEPS[currentStep]?.label}
              </h2>
              <p className="polaria-text-body-sm mt-2 text-polaria-w-50">
                {completedSteps[currentStep]
                  ? "Este paso ya se completó. Puedes volver atrás o continuar."
                  : "Completa los campos y continúa al siguiente paso."}
              </p>

              <div className="mt-6">{renderStepForm()}</div>

              {error ? (
                <p
                  role="alert"
                  className="polaria-text-body-sm mt-4 text-polaria-warning"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-polaria-w-08 pt-5">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 0 || isSubmitting}
                  className={cn(
                    "rounded-xl border border-polaria-t-20 px-4 py-3 polaria-text-body-sm font-semibold text-polaria-w transition",
                    "hover:border-polaria-teal hover:text-polaria-teal",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                >
                  Atrás
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void handleNext();
                  }}
                  disabled={isSubmitting}
                  className={cn(
                    "inline-flex min-w-[8rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-3 polaria-text-body-sm font-semibold text-polaria-bg transition hover:opacity-90",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Guardando…
                    </>
                  ) : isLastStep ? (
                    "Finalizar"
                  ) : (
                    "Siguiente"
                  )}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
