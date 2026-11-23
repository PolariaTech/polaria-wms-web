"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { WmsRol } from "@/constants/wms/roles";
import {
  PolariaFormField,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import {
  analyzePassword,
  normalizePasswordInput,
} from "@/lib/utils/password-strength";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import {
  getUsuarioAsignacionLabel,
  getUsuarioAsignacionTipo,
} from "../constants/usuario-rol-asignacion";
import {
  createUsuarioConfigurator,
  listBodegasAssignOptions,
  listCuentasAssignOptions,
  listRolesConfigurator,
  type BodegaAssignOption,
  type CuentaAssignOption,
  type RolOption,
} from "@/modules/configurator/usuarios/services/usuarios.service";
import { RolAssignPickerModal } from "./RolAssignPickerModal";
import {
  INITIAL_FORM,
  type UsuarioCreateModalProps,
} from "./usuario-create-modal.constants";
import {
  UsuarioCredencialesSection,
  UsuarioIdentidadSection,
} from "./usuario-create-modal.sections";
import { UsuarioAsignadoField } from "./usuario-create-modal.asignado-field";

export function UsuarioCreateModal({
  open,
  onClose,
  onCreated,
  lockedCodigoCuenta,
}: UsuarioCreateModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [cuentas, setCuentas] = useState<CuentaAssignOption[]>([]);
  const [bodegas, setBodegas] = useState<BodegaAssignOption[]>([]);
  const [rolPickerOpen, setRolPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const asignacionTipo = getUsuarioAsignacionTipo(form.idRol);
  const asignacionLabel = getUsuarioAsignacionLabel(form.idRol);

  const rolLabel = useMemo(() => {
    if (!form.idRol) return "";
    const selected = roles.find((rol) => rol.idRol === form.idRol);
    if (!selected) return form.idRol;
    return `${selected.nombre} (${selected.idRol})`;
  }, [form.idRol, roles]);

  useEffect(() => {
    if (!open) return;

    setForm({
      ...INITIAL_FORM,
      codigoCuenta: lockedCodigoCuenta ?? "",
    });
    setRolPickerOpen(false);
    setError(null);
    setIsSubmitting(false);
    setIsLoadingOptions(true);

    void Promise.all([
      listRolesConfigurator(),
      listCuentasAssignOptions(),
      listBodegasAssignOptions(),
    ])
      .then(([nextRoles, nextCuentas, nextBodegas]) => {
        setRoles(nextRoles);
        setCuentas(nextCuentas);
        setBodegas(nextBodegas);
      })
      .catch(() => {
        setError("No se pudieron cargar roles, cuentas o bodegas.");
      })
      .finally(() => {
        setIsLoadingOptions(false);
      });
  }, [lockedCodigoCuenta, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleRolChange = (idRol: WmsRol | "") => {
    setForm((current) => ({
      ...current,
      idRol,
      codigoCuenta: lockedCodigoCuenta ?? "",
      idBodega: "",
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.idRol) {
      setError("Selecciona un rol.");
      return;
    }

    const username = generateCodigoCuentaFromNombre(form.nombre);
    if (!username) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (asignacionTipo === "cuenta" && !form.codigoCuenta) {
      setError("Selecciona la cuenta a asignar.");
      return;
    }

    if (asignacionTipo === "bodega" && !form.idBodega) {
      setError("Selecciona la bodega a asignar.");
      return;
    }

    const clave = normalizePasswordInput(form.clave);
    const passwordAnalysis = analyzePassword(clave);
    if (!passwordAnalysis.isValid) {
      setError(passwordAnalysis.errors[0] ?? "La contraseña no es válida.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createUsuarioConfigurator({
        codigo: username,
        nombre: form.nombre,
        idRol: form.idRol,
        codigoCuenta:
          asignacionTipo === "cuenta"
            ? form.codigoCuenta
            : asignacionTipo === "bodega"
              ? form.codigoCuenta || null
              : null,
        idBodega: asignacionTipo === "bodega" ? form.idBodega : null,
        correo: form.correo,
        telefono: null,
        clave,
        accesoWms: form.accesoWms,
        accesoMateo: form.accesoMateo,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear el usuario.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting || isLoadingOptions;

  const cuentasOpciones = useMemo(() => {
    if (!lockedCodigoCuenta) return cuentas;
    return cuentas.filter(
      (cuenta) => cuenta.codigoCuenta === lockedCodigoCuenta,
    );
  }, [cuentas, lockedCodigoCuenta]);

  const bodegasOpciones = useMemo(() => {
    if (!lockedCodigoCuenta) return bodegas;
    return bodegas.filter(
      (bodega) => bodega.codigoCuenta === lockedCodigoCuenta,
    );
  }, [bodegas, lockedCodigoCuenta]);

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        sectionLabel="Nuevo usuario"
        title="Crear usuario"
        description="Rol, asignación, correo y productos de acceso."
        size="lg"
        compact
        closeOnEscape={!rolPickerOpen}
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSubmitting}
        submitDisabled={isLoadingOptions}
        submitLabel="Crear"
      >
        <div className="space-y-5">
          <UsuarioIdentidadSection form={form} setForm={setForm} disabled={disabled} />

          <section className="space-y-2">
            <p className="polaria-text-caption text-polaria-w-50">
              Rol y asignación
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <PolariaFormField id="usuario-rol" label="Rol" required compact>
                <JefeBodegaModalSearchField
                  id="usuario-rol"
                  value={rolLabel}
                  placeholder={
                    isLoadingOptions ? "Cargando roles…" : "Selecciona un rol"
                  }
                  ariaLabel="Rol"
                  compact
                  onSearchClick={
                    disabled
                      ? undefined
                      : () => {
                          setRolPickerOpen(true);
                        }
                  }
                />
              </PolariaFormField>
              <UsuarioAsignadoField
                asignacionTipo={asignacionTipo}
                asignacionLabel={asignacionLabel}
                form={form}
                setForm={setForm}
                disabled={disabled}
                lockedCodigoCuenta={lockedCodigoCuenta}
                cuentasOpciones={cuentasOpciones}
                bodegasOpciones={bodegasOpciones}
              />
            </div>
          </section>

          <UsuarioCredencialesSection form={form} setForm={setForm} disabled={disabled} />
        </div>
      </PolariaFormModal>

      <RolAssignPickerModal
        open={rolPickerOpen}
        onClose={() => setRolPickerOpen(false)}
        roles={roles}
        selectedId={form.idRol || null}
        onSelect={(rol) => {
          handleRolChange(rol.idRol);
          setError(null);
        }}
      />
    </>
  );
}
