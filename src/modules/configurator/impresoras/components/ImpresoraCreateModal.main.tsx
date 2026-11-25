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
  createImpresoraConfigurator,
  defaultsForCamino,
  labelCaminoImpresora,
  updateImpresoraConfigurator,
  type ImpresoraCamino,
} from "@/modules/configurator/impresoras/services/impresoras.service";
import {
  listCuentasAssignOptions,
  type CuentaAssignOption,
} from "@/modules/configurator/usuarios/services/usuarios.service";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import {
  INITIAL_FORM,
  formFromImpresora,
  type ImpresoraCreateModalProps,
} from "./impresora-create-modal.constants";
import {
  ImpresoraCreateCaminoFields,
  ImpresoraCreateCaminoPicker,
} from "./impresora-create-modal.fields";

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
          <ImpresoraCreateCaminoPicker
            camino={form.camino}
            disabled={isSubmitting}
            onChange={handleCaminoChange}
          />

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

          <ImpresoraCreateCaminoFields form={form} updateField={updateField} />
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

