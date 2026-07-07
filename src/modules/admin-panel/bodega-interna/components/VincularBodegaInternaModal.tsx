"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Warehouse } from "lucide-react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  listBodegasInternasDisponiblesAdmin,
  vincularBodegaInternaAdmin,
  type BodegaInternaDisponibleRow,
} from "../services/bodegas-internas-admin.service";

interface VincularBodegaInternaModalProps {
  open: boolean;
  onClose: () => void;
  onLinked: () => void;
}

export function VincularBodegaInternaModal({
  open,
  onClose,
  onLinked,
}: VincularBodegaInternaModalProps) {
  const { codigoCuenta, codigoEmpresa } = useCompany();
  const [options, setOptions] = useState<BodegaInternaDisponibleRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!open) return;

    setSelectedId(null);
    setError(null);
    setIsSubmitting(false);

    if (!codigoCuenta || !codigoEmpresa) {
      setOptions([]);
      return;
    }

    setIsLoadingOptions(true);

    void listBodegasInternasDisponiblesAdmin({ codigoCuenta, codigoEmpresa })
      .then(setOptions)
      .catch(() => {
        setError("No se pudieron cargar las bodegas disponibles.");
      })
      .finally(() => {
        setIsLoadingOptions(false);
      });
  }, [codigoCuenta, codigoEmpresa, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!codigoCuenta || !codigoEmpresa) {
      setError("No se encontró el contexto de cuenta o empresa.");
      return;
    }

    if (!selectedId) {
      setError("Selecciona una bodega del listado.");
      return;
    }

    setIsSubmitting(true);

    try {
      await vincularBodegaInternaAdmin({
        codigoCuenta,
        codigoEmpresa,
        idBodega: selectedId,
      });
      onLinked();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo vincular la bodega.",
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
      sectionLabel="Vincular cuenta"
      title="Vincular bodega interna"
      compact
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Vincular ahora"
    >
      <div className="flex flex-col gap-4">
        <p className="polaria-text-body-sm text-polaria-w-50">
          Cuenta:{" "}
          <span className="font-semibold text-polaria-w">
            {codigoCuenta ?? "—"}
          </span>
        </p>

        <div>
          <p className="polaria-text-label mb-2 text-polaria-w-50">Listado</p>

          {isLoadingOptions ? (
            <p className="polaria-text-body-sm text-polaria-w-50">
              Cargando bodegas…
            </p>
          ) : options.length === 0 ? (
            <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
              No hay bodegas internas disponibles para vincular.
            </p>
          ) : (
            <ul className="polaria-scrollbar flex max-h-64 flex-col gap-2 overflow-y-auto">
              {options.map((bodega) => {
                const isSelected = selectedId === bodega.idBodega;

                return (
                  <li key={bodega.idBodega}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedId(bodega.idBodega)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                        isSelected
                          ? "border-polaria-teal bg-polaria-t-20"
                          : "border-polaria-w-08 bg-polaria-w-08 hover:border-polaria-t-20",
                      )}
                    >
                      <Warehouse
                        className="h-5 w-5 shrink-0 text-polaria-w-50"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <span className="polaria-text-body-sm font-medium text-polaria-w">
                        {bodega.nombre}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </PolariaFormModal>
  );
}
