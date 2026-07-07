"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { WmsRol } from "@/constants/wms/roles";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
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

interface UsuarioCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  nombre: "",
  idRol: "" as WmsRol | "",
  codigoCuenta: "",
  idBodega: "",
  correo: "",
  clave: "",
};

export function UsuarioCreateModal({
  open,
  onClose,
  onCreated,
}: UsuarioCreateModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [cuentas, setCuentas] = useState<CuentaAssignOption[]>([]);
  const [bodegas, setBodegas] = useState<BodegaAssignOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const asignacionTipo = getUsuarioAsignacionTipo(form.idRol);
  const asignacionLabel = getUsuarioAsignacionLabel(form.idRol);
  const codigoCuentaDisplay = useMemo(() => {
    if (asignacionTipo !== "cuenta") return "";
    return form.codigoCuenta;
  }, [asignacionTipo, form.codigoCuenta]);

  useEffect(() => {
    if (!open) return;

    setForm(INITIAL_FORM);
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
  }, [open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleRolChange = (idRol: WmsRol | "") => {
    setForm((current) => ({
      ...current,
      idRol,
      codigoCuenta: "",
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
          compact
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
          disabled={disabled}
          placeholder="Selecciona una cuenta"
          options={cuentas.map((cuenta) => ({
            value: cuenta.codigoCuenta,
            label: cuenta.nombreComercial,
          }))}
          compact
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
            const selected = bodegas.find(
              (bodega) => bodega.idBodega === event.target.value,
            );
            setForm((current) => ({
              ...current,
              idBodega: event.target.value,
              codigoCuenta: selected?.codigoCuenta ?? "",
            }));
          }}
          disabled={disabled}
          placeholder="Selecciona una bodega"
          options={bodegas.map((bodega) => ({
            value: bodega.idBodega,
            label: `${bodega.nombre} (${bodega.codigo})`,
          }))}
          compact
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
          compact
        />
      );
    }

    return null;
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nuevo usuario"
      title="Crear usuario"
      compact
      size="lg"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PolariaFormInput
          id="usuario-id"
          label="ID único"
          value=""
          placeholder="Se genera al guardar"
          readOnly
          disabled
          compact
        />

        <PolariaFormInput
          id="usuario-codigo"
          label="Código"
          value={codigoCuentaDisplay}
          placeholder={
            asignacionTipo === "cuenta"
              ? "Según la cuenta asignada"
              : "Se genera al guardar"
          }
          readOnly
          disabled
          compact
        />

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
          compact
          fieldClassName="sm:col-span-2"
        />

        <PolariaFormSelect
          id="usuario-rol"
          label="Rol"
          value={form.idRol}
          onChange={(event) =>
            handleRolChange(event.target.value as WmsRol | "")
          }
          disabled={disabled}
          placeholder="Selecciona un rol"
          options={roles.map((rol) => ({
            value: rol.idRol,
            label: rol.nombre,
          }))}
          compact
        />

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
          compact
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
          compact
        />
      </div>
    </PolariaFormModal>
  );
}
