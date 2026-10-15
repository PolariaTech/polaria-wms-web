"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { CuentaAssignPickerModal } from "@/modules/configurator/bodega-interna/components/CuentaAssignPickerModal";
import {
  caminoFromModoEnvio,
  createImpresoraConfigurator,
  defaultsForCamino,
  labelCaminoImpresora,
  updateImpresoraConfigurator,
  type ImpresoraCamino,
  type ImpresoraListRow,
  type ImpresoraPais,
} from "@/modules/configurator/impresoras/services/impresoras.service";
import {
  listCuentasAssignOptions,
  type CuentaAssignOption,
} from "@/modules/configurator/usuarios/services/usuarios.service";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";

interface ImpresoraCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  impresora?: ImpresoraListRow | null;
  /** Si viene, la impresora queda fijada a esa cuenta (cockpit de cuenta). */
  lockedCodigoCuenta?: string | null;
}

const CAMINOS: ReadonlyArray<{
  id: ImpresoraCamino;
  title: string;
  hint: string;
}> = [
  {
    id: "qz",
    title: "QZ Tray",
    hint: "PC local con Windows",
  },
  {
    id: "brother_email",
    title: "Brother",
    hint: "Envío por correo",
  },
  {
    id: "epson_connect",
    title: "Epson Connect",
    hint: "Nube Epson",
  },
];

const INITIAL_FORM = {
  camino: "qz" as ImpresoraCamino,
  nombre: "",
  codigoCuenta: "",
  pais: "MX" as ImpresoraPais,
  nombreSistema: "",
  emailDestino: "",
};

function formFromImpresora(row: ImpresoraListRow): typeof INITIAL_FORM {
  return {
    camino: caminoFromModoEnvio(row.modoEnvio),
    nombre: row.nombre,
    codigoCuenta: row.codigoCuenta,
    pais: row.pais,
    nombreSistema: row.nombreSistema ?? "",
    emailDestino: row.emailDestino ?? "",
  };
}

export function ImpresoraCreateModal({
  open,
  onClose,
  onSaved,
  impresora = null,
  lockedCodigoCuenta = null,
}: ImpresoraCreateModalProps) {
  const isEdit = Boolean(impresora?.idImpresora);
  const lockedCuenta = lockedCodigoCuenta?.trim() || null;
  const [form, setForm] = useState(INITIAL_FORM);
  const [cuentas, setCuentas] = useState<CuentaAssignOption[]>([]);
  const [cuentaPickerOpen, setCuentaPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const cuentaLabel = useMemo(() => {
    if (!form.codigoCuenta) return "";
    const cuenta = cuentas.find((c) => c.codigoCuenta === form.codigoCuenta);
    if (!cuenta) return form.codigoCuenta;
    return `${cuenta.nombreComercial} (${cuenta.codigoCuenta})`;
  }, [cuentas, form.codigoCuenta]);

  useEffect(() => {
    if (!open) return;

    const base = impresora ? formFromImpresora(impresora) : INITIAL_FORM;
    setForm({
      ...base,
      codigoCuenta: lockedCuenta || base.codigoCuenta,
    });
    setCuentaPickerOpen(false);
    setError(null);
    setIsSubmitting(false);
    setIsLoadingOptions(true);

    void listCuentasAssignOptions()
      .then((nextCuentas) => {
        setCuentas(nextCuentas);
      })
      .catch(() => {
        setError("No se pudieron cargar las cuentas.");
      })
      .finally(() => {
        setIsLoadingOptions(false);
      });
  }, [open, impresora, lockedCuenta]);

  const updateField = useCallback(
    <K extends keyof typeof INITIAL_FORM>(
      key: K,
      value: (typeof INITIAL_FORM)[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleCaminoChange = (camino: ImpresoraCamino) => {
    setForm((prev) => ({
      ...prev,
      camino,
      nombreSistema: camino === "qz" ? prev.nombreSistema : "",
      emailDestino: camino === "qz" ? "" : prev.emailDestino,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const defaults = defaultsForCamino(form.camino);
    const codigoCuenta = (lockedCuenta || form.codigoCuenta).trim();

    try {
      const payload = {
        nombre: form.nombre,
        codigoCuenta,
        idBodega: null,
        marca: defaults.marca || null,
        modelo: null,
        pais: form.pais,
        ubicacionTexto: null,
        tipoConexion: defaults.tipoConexion,
        modoEnvio: defaults.modoEnvio,
        hostIp: null,
        puerto: null,
        colaNombre: null,
        nombreSistema:
          form.camino === "qz" ? form.nombreSistema || null : null,
        idAgente: null,
        emailDestino:
          form.camino === "qz" ? null : form.emailDestino || null,
        usaTls: false,
        tamanoPapel: "letter" as const,
        orientacion: "portrait" as const,
        duplex: "none" as const,
        colorModo: "mono" as const,
        bandeja: null,
        copiasDefault: 1,
        notas: null,
      };

      if (isEdit && impresora) {
        await updateImpresoraConfigurator({
          ...payload,
          idImpresora: impresora.idImpresora,
          estaActiva: impresora.estaActiva,
        });
      } else {
        await createImpresoraConfigurator(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo guardar la impresora.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting || isLoadingOptions;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={onClose}
        sectionLabel="Configurador"
        title={isEdit ? "Editar impresora" : "Configurar impresora"}
        description={`Camino: ${labelCaminoImpresora(form.camino)}. Una por cuenta: al imprimir se usa sola, sin diálogo.`}
        onSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
        submitDisabled={isLoadingOptions}
        submitLabel={isEdit ? "Guardar cambios" : "Guardar impresora"}
        size="lg"
        compact
        closeOnEscape={!cuentaPickerOpen}
      >
        <div className="space-y-5">
          <section className="space-y-2">
            <p className="polaria-text-caption text-polaria-w-50">
              Cómo imprime
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {CAMINOS.map((camino) => {
                const active = form.camino === camino.id;
                return (
                  <button
                    key={camino.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCaminoChange(camino.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition-opacity ${
                      active
                        ? "border-polaria-teal bg-polaria-t-08"
                        : "border-polaria-w-08 bg-polaria-bg hover:border-polaria-t-20"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-polaria-w">
                      {camino.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-polaria-w-50">
                      {camino.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <PolariaFormInput
              id="imp-nombre"
              label="Nombre"
              value={form.nombre}
              onChange={(e) => updateField("nombre", e.target.value)}
              placeholder="Ej. Oficina Bogotá"
              required
              compact
            />
            <PolariaFormField id="imp-cuenta" label="Cuenta" required compact>
              <JefeBodegaModalSearchField
                id="imp-cuenta"
                value={cuentaLabel}
                placeholder={
                  isLoadingOptions ? "Cargando cuentas…" : "Buscar cuenta"
                }
                ariaLabel="Cuenta"
                compact
                onSearchClick={
                  disabled || lockedCuenta
                    ? undefined
                    : () => setCuentaPickerOpen(true)
                }
              />
            </PolariaFormField>
          </section>

          {form.camino === "qz" ? (
            <section className="space-y-3">
              <PolariaFormInput
                id="imp-windows"
                label="Nombre en Windows"
                value={form.nombreSistema}
                onChange={(e) => updateField("nombreSistema", e.target.value)}
                placeholder="Como aparece en Impresoras de Windows"
                required
                compact
              />
              <p className="text-xs text-polaria-w-50">
                Instala QZ Tray en el PC que imprime (
                <a
                  href="https://qz.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-polaria-teal underline"
                >
                  qz.io
                </a>
                ).
              </p>
            </section>
          ) : null}

          {form.camino === "brother_email" ? (
            <section className="space-y-3">
              <PolariaFormInput
                id="imp-email-brother"
                label="Correo de la impresora"
                value={form.emailDestino}
                onChange={(e) => updateField("emailDestino", e.target.value)}
                placeholder="ejemplo@print.brother.com"
                type="email"
                required
                compact
              />
              <p className="text-xs text-polaria-w-50">
                En la Brother: Apps → Attach, Email and Print → copia el correo
                único de la máquina.
              </p>
            </section>
          ) : null}

          {form.camino === "epson_connect" ? (
            <section className="space-y-3">
              <PolariaFormInput
                id="imp-email-epson"
                label="Correo Epson Connect"
                value={form.emailDestino}
                onChange={(e) => updateField("emailDestino", e.target.value)}
                placeholder="ejemplo@print.epsonconnect.com"
                type="email"
                required
                compact
              />
              <p className="text-xs text-polaria-w-50">
                Activa Remote Print en Epson Connect. El envío usa SMTP /
                credenciales del servidor.
              </p>
            </section>
          ) : null}
        </div>
      </PolariaFormModal>

      {!lockedCuenta ? (
        <CuentaAssignPickerModal
          open={cuentaPickerOpen}
          onClose={() => setCuentaPickerOpen(false)}
          cuentas={cuentas}
          selectedCodigo={form.codigoCuenta || null}
          onSelect={(cuenta) => {
            updateField("codigoCuenta", cuenta.codigoCuenta);
            setError(null);
          }}
        />
      ) : null}
    </>
  );
}
