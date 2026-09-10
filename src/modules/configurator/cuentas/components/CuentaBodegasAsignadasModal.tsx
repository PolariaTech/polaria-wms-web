"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { cn } from "@/lib/utils/cn";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  updateCuentaBodegaDefaultConfigurator,
  type CuentaBodegaAsignada,
} from "../services/cuentas.service";

interface CuentaBodegasAsignadasModalProps {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string;
  cuentaNombre: string;
  bodegas: CuentaBodegaAsignada[];
  idBodegaDefault: string | null;
  onSaved?: () => void;
}

function formatCapacidad(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("es-CL");
}

function formatTipo(tipo: string): string {
  if (tipo === "interna") return "Interna";
  if (tipo === "externa") return "Externa";
  return tipo;
}

export function CuentaBodegasAsignadasModal({
  open,
  onClose,
  codigoCuenta,
  cuentaNombre,
  bodegas,
  idBodegaDefault,
  onSaved,
}: CuentaBodegasAsignadasModalProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setIsSubmitting(false);
    const initial =
      (idBodegaDefault &&
        bodegas.find((item) => item.idBodega === idBodegaDefault)?.idBodega) ||
      (bodegas.length === 1 ? bodegas[0]!.idBodega : "") ||
      "";
    setSelectedId(initial);
  }, [open, idBodegaDefault, bodegas]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId) {
      setError("Selecciona una bodega por defecto.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await updateCuentaBodegaDefaultConfigurator({
        codigoCuenta,
        idBodegaDefault: selectedId,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo guardar la bodega por defecto.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSave = bodegas.length > 0;

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title="Bodegas asignadas"
      description={`Elige la bodega por defecto de ${cuentaNombre}.`}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      asForm={canSave}
      hideHeaderClose
      error={error}
      isSubmitting={isSubmitting}
      submitDisabled={!selectedId || !canSave}
      submitLabel="Guardar bodega por defecto"
      cancelLabel={canSave ? "Cancelar" : "Cerrar"}
      footerAction={canSave ? undefined : <></>}
      compact
      size="lg"
    >
      {bodegas.length === 0 ? (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-3 polaria-text-body-sm text-polaria-w-50">
          No hay bodegas asignadas a esta cuenta.
        </p>
      ) : (
        <div className="max-h-[min(55dvh,24rem)] overflow-auto rounded-xl border border-polaria-w-08">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[36%]" />
              <col className="w-[22%]" />
              <col className="w-[32%]" />
            </colgroup>
            <thead className="sticky top-0 bg-polaria-t-08">
              <tr className="border-b border-polaria-t-20">
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Default
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Nombre
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Tipo
                </th>
                <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                  Capacidad
                </th>
              </tr>
            </thead>
            <tbody>
              {bodegas.map((bodega) => {
                const checked = selectedId === bodega.idBodega;
                return (
                  <tr
                    key={bodega.idBodega}
                    className={cn(
                      "border-b border-polaria-w-08 last:border-b-0",
                      checked && "bg-polaria-t-08",
                    )}
                  >
                    <td className="px-3 py-2.5 align-middle">
                      <input
                        type="radio"
                        name="bodega-default"
                        value={bodega.idBodega}
                        checked={checked}
                        onChange={() => setSelectedId(bodega.idBodega)}
                        aria-label={`Usar ${bodega.nombre} como bodega por defecto`}
                        className="size-4 accent-[var(--teal)]"
                      />
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w">
                      <button
                        type="button"
                        onClick={() => setSelectedId(bodega.idBodega)}
                        className="text-left transition hover:text-polaria-teal"
                      >
                        {bodega.nombre}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <PolariaTableBadge
                        variant={
                          bodega.tipo === "interna" ? "positive" : "neutral"
                        }
                      >
                        {formatTipo(bodega.tipo)}
                      </PolariaTableBadge>
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2.5 align-middle polaria-text-body-sm",
                        "text-polaria-w-50",
                      )}
                    >
                      {formatCapacidad(bodega.capacidad)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PolariaFormModal>
  );
}
