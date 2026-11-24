import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import type { Dispatch, SetStateAction } from "react";
import {
  isUsuarioAsignacionFija,
  USUARIO_ASIGNACION_VALOR_FIJO,
  type UsuarioAsignacionTipo,
} from "../constants/usuario-rol-asignacion";
import type {
  BodegaAssignOption,
  CuentaAssignOption,
} from "@/modules/configurator/usuarios/services/usuarios.service";
import type { UsuarioFormState } from "./usuario-create-modal.constants";

interface UsuarioAsignadoFieldProps {
  asignacionTipo: UsuarioAsignacionTipo | null;
  asignacionLabel: string;
  form: UsuarioFormState;
  setForm: Dispatch<SetStateAction<UsuarioFormState>>;
  disabled: boolean;
  lockedCodigoCuenta?: string;
  cuentasOpciones: CuentaAssignOption[];
  bodegasOpciones: BodegaAssignOption[];
}

export function UsuarioAsignadoField({
  asignacionTipo,
  asignacionLabel,
  form,
  setForm,
  disabled,
  lockedCodigoCuenta,
  cuentasOpciones,
  bodegasOpciones,
}: UsuarioAsignadoFieldProps) {
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
        disabled={disabled || Boolean(lockedCodigoCuenta)}
        placeholder="Selecciona una cuenta"
        options={cuentasOpciones.map((cuenta) => ({
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
}
