"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import { useAuthStore } from "@/stores/auth.store";
import {
  FICHA_EN_BLANCO,
  fichaParaGuardar,
  fichaTieneTexto,
  mensajeFicha,
  mensajeLogo,
  type EmpresaFichaCampos,
} from "../domain/empresa-ficha-fiscal";
import { createEmpresaConfigurator } from "../services/empresas.service";
import { EmpresaDescartarDialog } from "./EmpresaDescartarDialog";
import { EmpresaFichaFields } from "./EmpresaFichaFields";

interface EmpresaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  razonSocial: "",
  codigoEmpresa: "",
  telefono: "",
};

export function EmpresaCreateModal({
  open,
  onClose,
  onCreated,
}: EmpresaCreateModalProps) {
  const idCreador = useAuthStore((state) => state.session?.idUsuario ?? null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [ficha, setFicha] = useState<EmpresaFichaCampos>(FICHA_EN_BLANCO);
  const [logo, setLogo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(INITIAL_FORM);
    setFicha(FICHA_EN_BLANCO);
    setLogo(null);
    setVistaPrevia(null);
    setConfirmarSalida(false);
    setError(null);
    setIsSubmitting(false);
  }, [open]);

  const hayCambios =
    Boolean(form.razonSocial.trim() || form.telefono.trim() || logo) ||
    fichaTieneTexto(ficha);

  const cerrar = useCallback(() => {
    setConfirmarSalida(false);
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    if (hayCambios) {
      setConfirmarSalida(true);
      return;
    }
    cerrar();
  }, [cerrar, hayCambios, isSubmitting]);

  const handleRazonSocialChange = (value: string) => {
    setForm((current) => ({
      ...current,
      razonSocial: value,
      codigoEmpresa: generateCodigoCuentaFromNombre(value),
    }));
  };

  const elegirLogo = (archivo: File | null) => {
    setLogo(archivo);
    setVistaPrevia(archivo ? URL.createObjectURL(archivo) : null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const errorFicha = mensajeFicha(ficha);
    const errorLogo = logo ? mensajeLogo(logo) : null;
    if (form.telefono.trim() && !isValidInternationalPhone(form.telefono)) {
      setError("Ingresa un número de teléfono válido.");
      setIsSubmitting(false);
      return;
    }
    if (errorFicha || errorLogo) {
      setError(errorFicha ?? errorLogo);
      setIsSubmitting(false);
      return;
    }

    try {
      await createEmpresaConfigurator({
        razonSocial: form.razonSocial,
        codigoEmpresa: form.codigoEmpresa,
        telefono: form.telefono,
        idCreador,
        ...fichaParaGuardar(ficha),
        logo,
      });
      onCreated();
      cerrar();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear la empresa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        sectionLabel="Nueva empresa"
        title="Crear empresa"
        description="Completa los campos para registrar una empresa."
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel="Crear"
        hideHeaderClose
      >
        <PolariaFormInput
          id="empresa-razon-social"
          label="Razón social"
          value={form.razonSocial}
          placeholder="Nombre legal de la empresa"
          onChange={(event) => handleRazonSocialChange(event.target.value)}
          disabled={isSubmitting}
          autoFocus
        />
        <PolariaPhoneInput
          id="empresa-telefono"
          label="Teléfono"
          value={form.telefono}
          onChange={(value) =>
            setForm((current) => ({ ...current, telefono: value }))
          }
          disabled={isSubmitting}
          hint="Opcional. Formato internacional."
        />
        <EmpresaFichaFields
          idPrefix="empresa"
          valores={ficha}
          disabled={isSubmitting}
          logoNombreActual={null}
          vistaPrevia={vistaPrevia}
          onChange={(campo, valor) =>
            setFicha((current) => ({ ...current, [campo]: valor }))
          }
          onLogo={elegirLogo}
          onQuitarLogo={() => elegirLogo(null)}
        />
      </PolariaFormModal>
      <EmpresaDescartarDialog
        open={confirmarSalida}
        onSalir={cerrar}
        onSeguir={() => setConfirmarSalida(false)}
      />
    </>
  );
}
