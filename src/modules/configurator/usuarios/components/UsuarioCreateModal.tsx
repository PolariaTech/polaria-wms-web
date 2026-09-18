"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { WmsRol } from "@/constants/wms/roles";
import {
  PolariaFormField,
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPasswordStrengthField } from "@/components/shared/form/PolariaPasswordStrengthField";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import {
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "@/constants/ui/phone-countries";
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
  isUsuarioAsignacionFija,
  USUARIO_ASIGNACION_VALOR_FIJO,
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
import { CuentaAccesoGrantPanel } from "@/modules/configurator/cuentas/components/CuentaAccesoGrantPanel";
import { RolAssignPickerModal } from "./RolAssignPickerModal";

interface UsuarioCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  lockedCodigoCuenta?: string;
}

const INITIAL_FORM = {
  nombre: "",
  idRol: "" as WmsRol | "",
  codigoCuenta: "",
  idBodega: "",
  correo: "",
  telefono: "",
  clave: "",
  accesoWms: true,
  accesoMateo: true,
};

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

    const telefono = form.telefono.trim()
      ? normalizeInternationalPhone(form.telefono)
      : "";
    if (telefono && !isValidInternationalPhone(telefono)) {
      setError("Ingresa un número de teléfono válido.");
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
        telefono: telefono || null,
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

  const renderAsignadoField = () => {
    if (!asignacionTipo) {
      return (
        <PolariaFormInput
          id="usuario-asignado"
          label="Asignado"
          value=""
          placeholder="Selecciona un rol primero"
          readOnly
          disabled
        />
      );
    }

    if (asignacionTipo === "cuenta") {
      return (
        <PolariaFormSelect
          id="usuario-asignado"
          label={asignacionLabel}
          value={form.codigoCuenta}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              codigoCuenta: event.target.value,
            }))
          }
          disabled={disabled || Boolean(lockedCodigoCuenta)}
          placeholder="Selecciona una cuenta"
          options={cuentasOpciones.map((cuenta) => ({
            value: cuenta.codigoCuenta,
            label: cuenta.nombreComercial,
          }))}
        />
      );
    }

    if (asignacionTipo === "bodega") {
      return (
        <PolariaFormSelect
          id="usuario-asignado"
          label={asignacionLabel}
          value={form.idBodega}
          onChange={(event) => {
            const selected = bodegasOpciones.find(
              (bodega) => bodega.idBodega === event.target.value,
            );
            setForm((current) => ({
              ...current,
              idBodega: event.target.value,
              codigoCuenta:
                lockedCodigoCuenta ?? selected?.codigoCuenta ?? "",
            }));
          }}
          disabled={disabled}
          placeholder="Selecciona una bodega"
          options={bodegasOpciones.map((bodega) => ({
            value: bodega.idBodega,
            label: `${bodega.nombre} (${bodega.codigo})`,
          }))}
        />
      );
    }

    if (isUsuarioAsignacionFija(asignacionTipo)) {
      return (
        <PolariaFormInput
          id="usuario-asignado"
          label={asignacionLabel}
          value={USUARIO_ASIGNACION_VALOR_FIJO[asignacionTipo] ?? ""}
          readOnly
          disabled
        />
      );
    }

    return null;
  };

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        sectionLabel="Nuevo usuario"
        title="Crear usuario"
        description="Completa los campos para registrar un usuario."
        size="md"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel="Crear"
      >
        <div className="flex flex-col gap-3">
          <PolariaFormInput
            id="usuario-nombre"
            label="Nombre"
            value={form.nombre}
            placeholder="Nombre completo"
            onChange={(event) =>
              setForm((current) => ({ ...current, nombre: event.target.value }))
            }
            disabled={disabled}
            autoFocus
          />

          <PolariaFormField id="usuario-rol" label="Rol">
            <JefeBodegaModalSearchField
              id="usuario-rol"
              value={rolLabel}
              placeholder={
                isLoadingOptions ? "Cargando roles…" : "Selecciona un rol"
              }
              ariaLabel="Rol"
              onSearchClick={
                disabled
                  ? undefined
                  : () => {
                      setRolPickerOpen(true);
                    }
              }
            />
          </PolariaFormField>

          {renderAsignadoField()}

          <PolariaFormInput
            id="usuario-correo"
            label="Correo"
            type="email"
            autoComplete="email"
            value={form.correo}
            placeholder="correo@empresa.com"
            onChange={(event) =>
              setForm((current) => ({ ...current, correo: event.target.value }))
            }
            disabled={disabled}
          />

          <PolariaPhoneInput
            id="usuario-telefono"
            label="Teléfono"
            value={form.telefono}
            onChange={(value) =>
              setForm((current) => ({ ...current, telefono: value }))
            }
            disabled={disabled}
            hint="Opcional. Formato internacional."
          />

          <PolariaPasswordStrengthField
            id="usuario-clave"
            label="Clave"
            value={form.clave}
            onChange={(value) =>
              setForm((current) => ({ ...current, clave: value }))
            }
            disabled={disabled}
          />

          <CuentaAccesoGrantPanel
            estaActiva
            accesoWms={form.accesoWms}
            accesoMateo={form.accesoMateo}
            disabled={disabled}
            showLogin={false}
            ariaLabel="Accesos del usuario"
            onToggleWms={() => {
              if (form.accesoWms && !form.accesoMateo) return;
              setForm((current) => ({
                ...current,
                accesoWms: !current.accesoWms,
              }));
            }}
            onToggleMateo={() => {
              if (form.accesoMateo && !form.accesoWms) return;
              setForm((current) => ({
                ...current,
                accesoMateo: !current.accesoMateo,
              }));
            }}
          />
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
