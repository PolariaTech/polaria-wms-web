"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  FICHA_EN_BLANCO,
  fichaDesdeEmpresa,
  fichaParaGuardar,
  mensajeFicha,
  mensajeLogo,
  type EmpresaFichaCampos,
} from "../domain/empresa-ficha-fiscal";
import {
  updateEmpresaConfigurator,
  type EmpresaListRow,
} from "../services/empresas.service";
import { EmpresaDescartarDialog } from "./EmpresaDescartarDialog";
import { EmpresaFichaFields } from "./EmpresaFichaFields";

interface EmpresaEditModalProps {
  open: boolean;
  empresa: EmpresaListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

const ESTADO_OPTIONS = [
  { value: "activa", label: "Activa" },
  { value: "inactiva", label: "Inactiva" },
] as const;

export function EmpresaEditModal({
  open,
  empresa,
  onClose,
  onUpdated,
}: EmpresaEditModalProps) {
  const [razonSocial, setRazonSocial] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState<"activa" | "inactiva">("activa");
  const [ficha, setFicha] = useState<EmpresaFichaCampos>(FICHA_EN_BLANCO);
  const [logo, setLogo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [quitarLogo, setQuitarLogo] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !empresa) return;
    setRazonSocial(empresa.razonSocial);
    setTelefono(empresa.telefono ?? "");
    setEstado(empresa.estaActiva ? "activa" : "inactiva");
    setFicha(fichaDesdeEmpresa(empresa));
    setLogo(null);
    setVistaPrevia(null);
    setQuitarLogo(false);
    setConfirmarSalida(false);
    setError(null);
    setIsSubmitting(false);
  }, [empresa, open]);

  const hayCambios =
    empresa != null &&
    (razonSocial !== empresa.razonSocial ||
      telefono !== (empresa.telefono ?? "") ||
      (estado === "activa") !== empresa.estaActiva ||
      logo !== null ||
      quitarLogo ||
      JSON.stringify(ficha) !== JSON.stringify(fichaDesdeEmpresa(empresa)));

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

  const elegirLogo = (archivo: File | null) => {
    const mensaje = archivo ? mensajeLogo(archivo) : null;
    if (mensaje) {
      setError(mensaje);
      setLogo(null);
      setVistaPrevia(null);
      return;
    }
    setError(null);
    setQuitarLogo(false);
    setLogo(archivo);
    setVistaPrevia(archivo ? URL.createObjectURL(archivo) : null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!empresa) return;
    setError(null);
    setIsSubmitting(true);

    const errorFicha = mensajeFicha(ficha);
    const errorLogo = logo ? mensajeLogo(logo) : null;
    if (telefono.trim() && !isValidInternationalPhone(telefono)) {
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
      await updateEmpresaConfigurator({
        codigoEmpresa: empresa.codigoEmpresa,
        razonSocial,
        telefono,
        estaActiva: estado === "activa",
        ...fichaParaGuardar(ficha),
        logo,
        quitarLogo,
      });
      onUpdated();
      cerrar();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar la empresa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const logoGuardado =
    quitarLogo || !empresa?.logoPath ? null : empresa.logoPath;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        sectionLabel="Editar empresa"
        title="Editar empresa"
        description="Actualiza los datos de la empresa."
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel="Guardar"
        hideHeaderClose
      >
        <PolariaFormInput
          id="edit-empresa-razon-social"
          label="Razón social"
          value={razonSocial}
          placeholder="Nombre legal de la empresa"
          onChange={(event) => setRazonSocial(event.target.value)}
          disabled={isSubmitting}
          autoFocus
        />
        <PolariaFormInput
          id="edit-empresa-codigo"
          label="Código empresa"
          value={empresa?.codigoEmpresa ?? ""}
          readOnly
          disabled
        />
        <PolariaPhoneInput
          id="edit-empresa-telefono"
          label="Teléfono"
          value={telefono}
          onChange={setTelefono}
          disabled={isSubmitting}
          hint="Opcional. Formato internacional."
        />
        <PolariaFormSelect
          id="edit-empresa-estado"
          label="Estado"
          value={estado}
          onChange={(event) =>
            setEstado(event.target.value === "inactiva" ? "inactiva" : "activa")
          }
          disabled={isSubmitting}
          options={[...ESTADO_OPTIONS]}
        />
        <EmpresaFichaFields
          idPrefix="edit-empresa"
          valores={ficha}
          disabled={isSubmitting}
          logoNombreActual={logoGuardado}
          vistaPrevia={vistaPrevia}
          onChange={(campo, valor) =>
            setFicha((current) => ({ ...current, [campo]: valor }))
          }
          onLogo={elegirLogo}
          onQuitarLogo={() => {
            setQuitarLogo(true);
            setLogo(null);
            setVistaPrevia(null);
          }}
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
