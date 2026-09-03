"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  getCompradorAdmin,
  updateCompradorAdmin,
  type CompradorListRow,
} from "../services/compradores.service";
import {
  altaFormStateFromDetalle,
  emptyAltaFormState,
  fichaFromAltaForm,
  type CompradorAltaFormState,
} from "../utils/comprador-alta";
import { CompradorAliasCreateModal } from "./CompradorAliasCreateModal";
import { CompradorAltaFormFields } from "./CompradorAltaFormFields";

interface CompradorEditModalProps {
  open: boolean;
  comprador: CompradorListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function CompradorEditModal({
  open,
  comprador,
  onClose,
  onUpdated,
}: CompradorEditModalProps) {
  const { codigoCuenta } = useCompany();
  const [form, setForm] = useState<CompradorAltaFormState>(emptyAltaFormState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAliasOpen, setIsAliasOpen] = useState(false);

  useEffect(() => {
    if (!open || !comprador) return;

    setForm({
      ...emptyAltaFormState(),
      nombreComercial: comprador.comprador,
      telefono: comprador.telefono ?? "",
    });
    setError(null);
    setIsSubmitting(false);
    setIsAliasOpen(false);

    if (!codigoCuenta) return;

    let cancelled = false;
    setIsLoading(true);

    void getCompradorAdmin({
      codigoCuenta,
      idComprador: comprador.idComprador,
    })
      .then((detalle) => {
        if (cancelled) return;
        setForm(
          altaFormStateFromDetalle(
            detalle.comprador,
            detalle.telefono ?? "",
            detalle.ficha,
          ),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo cargar la ficha del comprador.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, comprador, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting || isAliasOpen) return;
    onClose();
  }, [isAliasOpen, isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comprador) return;

    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    const ficha = fichaFromAltaForm(form);
    const nombre = form.nombreComercial.trim() || ficha.razonSocial.trim();
    if (!nombre) {
      setError("Falta el nombre comercial.");
      return;
    }

    const telefonoPrincipal = form.telefono.trim();
    const telefonoContacto = ficha.contactos
      .map((row) => row.telefono.trim())
      .find((value) => value && isValidInternationalPhone(value));
    const telefonoGuardar = telefonoPrincipal || telefonoContacto || "";

    if (telefonoPrincipal && !isValidInternationalPhone(telefonoPrincipal)) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCompradorAdmin({
        codigoCuenta,
        idComprador: comprador.idComprador,
        nombre,
        telefono: telefonoGuardar,
        ficha,
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar el comprador.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldsDisabled = isSubmitting || isLoading;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        sectionLabel="Editar comprador"
        title="Editar comprador"
        description="Actualiza la ficha del comprador o crea un alias de producto."
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel="Guardar"
        compact
        size="2xl"
        hideHeaderClose
        closeOnEscape={!isAliasOpen}
      >
        <CompradorAltaFormFields
          form={form}
          onChange={setForm}
          disabled={fieldsDisabled}
          idPrefix="edit-comprador"
          codigoValue={comprador?.codigo ?? ""}
        />

        <div className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3">
          <p className="polaria-text-label text-polaria-teal">
            Alias de producto
          </p>
          <p className="mt-1 polaria-text-caption text-polaria-w-50">
            Nombre con el que este comprador conoce un producto del catálogo.
          </p>
          <button
            type="button"
            onClick={() => setIsAliasOpen(true)}
            disabled={fieldsDisabled}
            className="mt-3 inline-flex items-center rounded-xl border border-polaria-t-20 px-4 py-2 polaria-text-body-sm font-semibold text-polaria-teal transition hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg"
          >
            Crear alias
          </button>
        </div>
      </PolariaFormModal>

      <CompradorAliasCreateModal
        open={isAliasOpen}
        comprador={comprador}
        onClose={() => setIsAliasOpen(false)}
        onCreated={() => {
          setIsAliasOpen(false);
          onUpdated();
        }}
      />
    </>
  );
}
