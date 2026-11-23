import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaPasswordStrengthField } from "@/components/shared/form/PolariaPasswordStrengthField";
import { CuentaAccesoGrantPanel } from "@/modules/configurator/cuentas/components/CuentaAccesoGrantPanel";
import type { Dispatch, SetStateAction } from "react";
import type { UsuarioFormState } from "./usuario-create-modal.constants";

interface UsuarioFormSectionProps {
  form: UsuarioFormState;
  setForm: Dispatch<SetStateAction<UsuarioFormState>>;
  disabled: boolean;
}

export function UsuarioIdentidadSection({
  form,
  setForm,
  disabled,
}: UsuarioFormSectionProps) {
  return (
  <section className="space-y-2">
    <p className="polaria-text-caption text-polaria-w-50">Identidad</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <PolariaFormInput
        id="usuario-nombre"
        label="Nombre"
        value={form.nombre}
        placeholder="Nombre completo"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            nombre: event.target.value,
          }))
        }
        disabled={disabled}
        autoFocus
        required
        compact
      />
      <PolariaFormInput
        id="usuario-correo"
        label="Correo"
        type="email"
        autoComplete="email"
        value={form.correo}
        placeholder="correo@empresa.com"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            correo: event.target.value,
          }))
        }
        disabled={disabled}
        required
        compact
      />
    </div>
  </section>
  );
}

export function UsuarioCredencialesSection({
  form,
  setForm,
  disabled,
}: UsuarioFormSectionProps) {
  return (
    <>
    <section className="space-y-2">
      <p className="polaria-text-caption text-polaria-w-50">
        Credenciales
      </p>
      <PolariaPasswordStrengthField
        id="usuario-clave"
        label="Clave"
        value={form.clave}
        onChange={(value) =>
          setForm((current) => ({ ...current, clave: value }))
        }
        disabled={disabled}
        compact
      />
    </section>

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
    </>
  );
}
