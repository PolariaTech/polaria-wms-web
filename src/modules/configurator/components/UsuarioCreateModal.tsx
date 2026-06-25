"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { WmsRol } from "@/constants/roles";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { DomainServiceError } from "@/lib/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/generate-codigo-cuenta";
import {
  createUsuarioConfigurator,
  listCuentasAssignOptions,
  listRolesConfigurator,
  type CuentaAssignOption,
  type RolOption,
} from "../services/usuarios.service";

interface UsuarioCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  codigo: "",
  nombre: "",
  idRol: "" as WmsRol | "",
  codigoCuenta: "",
  correo: "",
  clave: "",
};

export function UsuarioCreateModal({
  open,
  onClose,
  onCreated,
}: UsuarioCreateModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [codigoManual, setCodigoManual] = useState(false);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [cuentas, setCuentas] = useState<CuentaAssignOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(INITIAL_FORM);
    setCodigoManual(false);
    setError(null);
    setIsSubmitting(false);
    setIsLoadingOptions(true);

    void Promise.all([listRolesConfigurator(), listCuentasAssignOptions()])
      .then(([nextRoles, nextCuentas]) => {
        setRoles(nextRoles);
        setCuentas(nextCuentas);
      })
      .catch(() => {
        setError("No se pudieron cargar roles o cuentas.");
      })
      .finally(() => {
        setIsLoadingOptions(false);
      });
  }, [open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleNombreChange = (value: string) => {
    setForm((current) => ({
      ...current,
      nombre: value,
      codigo: codigoManual ? current.codigo : generateCodigoCuentaFromNombre(value),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.idRol) {
      setError("Selecciona un rol.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createUsuarioConfigurator({
        codigo: form.codigo,
        nombre: form.nombre,
        idRol: form.idRol,
        codigoCuenta: form.codigoCuenta || null,
        correo: form.correo,
        clave: form.clave,
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

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nuevo usuario"
      title="Crear usuario"
      description="Completa los campos para registrar un usuario."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear"
    >
      <PolariaFormInput
        id="usuario-id"
        label="ID único"
        value=""
        placeholder="Se genera al guardar"
        readOnly
        disabled
      />

      <PolariaFormInput
        id="usuario-codigo"
        label="Código"
        value={form.codigo}
        placeholder="Código del usuario"
        onChange={(event) => {
          setCodigoManual(true);
          setForm((current) => ({
            ...current,
            codigo: event.target.value.trim().toUpperCase(),
          }));
        }}
        disabled={disabled}
      />

      <PolariaFormInput
        id="usuario-nombre"
        label="Nombre"
        value={form.nombre}
        placeholder="Nombre completo"
        onChange={(event) => handleNombreChange(event.target.value)}
        disabled={disabled}
        autoFocus
      />

      <PolariaFormSelect
        id="usuario-rol"
        label="Rol"
        value={form.idRol}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            idRol: event.target.value as WmsRol,
          }))
        }
        disabled={disabled}
        placeholder="Selecciona un rol"
        options={roles.map((rol) => ({
          value: rol.idRol,
          label: rol.nombre,
        }))}
      />

      <PolariaFormSelect
        id="usuario-asignado"
        label="Asignado"
        value={form.codigoCuenta}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            codigoCuenta: event.target.value,
          }))
        }
        disabled={disabled}
        options={[
          { value: "", label: "Sin asignar" },
          ...cuentas.map((cuenta) => ({
            value: cuenta.codigoCuenta,
            label: cuenta.nombreComercial,
          })),
        ]}
      />

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

      <PolariaFormInput
        id="usuario-clave"
        label="Clave"
        type="password"
        autoComplete="new-password"
        value={form.clave}
        placeholder="Contraseña inicial"
        onChange={(event) =>
          setForm((current) => ({ ...current, clave: event.target.value }))
        }
        disabled={disabled}
      />
    </PolariaFormModal>
  );
}
