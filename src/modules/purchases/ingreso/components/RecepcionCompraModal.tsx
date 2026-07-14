"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatKgEs, parseDecimalEs } from "@/lib/utils/decimal-es";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { cerrarRecepcionCompraApi } from "../../shared/services/purchases-api.service";
import type { OrdenCompraLineaRow, OrdenCompraRow } from "../../shared/types/purchases.types";
import { resolveOrdenLineaTitulo } from "../../ordenes/utils/orden-compra-display";

interface RecepcionCompraModalProps {
  orden: OrdenCompraRow | null;
  onClose: () => void;
  onRegistered: () => void | Promise<void>;
}

interface DraftLinea {
  idLineaOrdenCompra: string;
  titulo: string;
  cantidadPedida: number;
  cantidadYaRecibida: number;
  cantidadRecibidaInput: string;
  temperaturaInput: string;
}

function pendingCantidad(linea: OrdenCompraLineaRow): number {
  const pedida = linea.cantidad;
  const recibida = linea.cantidad_recibida ?? 0;
  return Math.max(0, pedida - recibida);
}

function buildDraftLineas(lineas: OrdenCompraLineaRow[]): DraftLinea[] {
  return lineas.map((linea) => {
    const pendiente = pendingCantidad(linea);
    return {
      idLineaOrdenCompra: linea.id_linea_orden_compra,
      titulo: resolveOrdenLineaTitulo(linea),
      cantidadPedida: linea.cantidad,
      cantidadYaRecibida: linea.cantidad_recibida ?? 0,
      cantidadRecibidaInput: "",
      temperaturaInput: "",
    };
  });
}

export function RecepcionCompraModal({
  orden,
  onClose,
  onRegistered,
}: RecepcionCompraModalProps) {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const [lineas, setLineas] = useState<DraftLinea[]>([]);
  const [notas, setNotas] = useState("");
  const [idUbicacionIngreso, setIdUbicacionIngreso] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!orden) {
      return;
    }

    setLineas(buildDraftLineas(orden.lineas ?? []));
    setNotas("");
    setIdUbicacionIngreso("");
    setError(null);
    setIsSubmitting(false);
  }, [orden]);

  const canSubmit = useMemo(
    () => Boolean(orden && codigoCuenta && activeBodegaId && lineas.length),
    [activeBodegaId, codigoCuenta, lineas.length, orden],
  );

  if (!orden) {
    return null;
  }

  const updateLinea = (
    idLineaOrdenCompra: string,
    patch: Partial<Pick<DraftLinea, "cantidadRecibidaInput" | "temperaturaInput">>,
  ) => {
    setLineas((current) =>
      current.map((linea) =>
        linea.idLineaOrdenCompra === idLineaOrdenCompra
          ? { ...linea, ...patch }
          : linea,
      ),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || !codigoCuenta || !activeBodegaId) {
      setError("Falta cuenta o bodega activa.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const lineasPayload = lineas.map((linea, index) => {
        const cantidadRecibida = parseDecimalEs(linea.cantidadRecibidaInput);

        if (
          cantidadRecibida == null ||
          !Number.isFinite(cantidadRecibida) ||
          cantidadRecibida < 0
        ) {
          throw new DomainServiceError(
            `La cantidad recibida de la línea ${index + 1} no es válida.`,
            "INVALID_ARGUMENT",
          );
        }

        const temperatura = parseDecimalEs(linea.temperaturaInput);

        if (
          cantidadRecibida > 0 &&
          (temperatura == null ||
            !Number.isFinite(temperatura) ||
            Number.isNaN(temperatura))
        ) {
          throw new DomainServiceError(
            `La temperatura de la línea ${index + 1} es obligatoria cuando hay cantidad recibida.`,
            "INVALID_ARGUMENT",
          );
        }

        if (
          temperatura != null &&
          (!Number.isFinite(temperatura) || Number.isNaN(temperatura))
        ) {
          throw new DomainServiceError(
            `La temperatura de la línea ${index + 1} no es válida.`,
            "INVALID_ARGUMENT",
          );
        }

        return {
          idLineaOrdenCompra: linea.idLineaOrdenCompra,
          cantidadRecibida,
          ...(temperatura != null ? { temperaturaRegistrada: temperatura } : {}),
        };
      });

      await cerrarRecepcionCompraApi({
        idOrdenCompra: orden.id_orden_compra,
        codigoCuenta,
        idBodega: activeBodegaId,
        lineas: lineasPayload,
        ...(idUbicacionIngreso.trim()
          ? { idUbicacionIngreso: idUbicacionIngreso.trim() }
          : {}),
        ...(notas.trim() ? { notas: notas.trim() } : {}),
      });

      await onRegistered();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo registrar la recepción.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open
      onClose={onClose}
      sectionLabel="Recepción de mercancía"
      title={orden.codigo}
      description="Conciliación ciega contra la orden de compra emitida."
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
      submitDisabled={!canSubmit}
      submitLabel="Registrar recepción"
      size="lg"
      compact
    >
      {lineas.length === 0 ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          La orden no tiene líneas para recepcionar.
        </p>
      ) : (
        <ul className="space-y-3">
          {lineas.map((linea) => (
            <li
              key={linea.idLineaOrdenCompra}
              className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3"
            >
              <p className="font-medium text-polaria-w">{linea.titulo}</p>
              <p className="mt-1 polaria-text-body-sm text-polaria-w-50">
                Conciliación ciega — ingrese cantidad y temperatura recibidas
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <PolariaFormInput
                  id={`rec-cant-${linea.idLineaOrdenCompra}`}
                  label="Cantidad recibida (kg)"
                  inputMode="decimal"
                  value={linea.cantidadRecibidaInput}
                  onChange={(event) =>
                    updateLinea(linea.idLineaOrdenCompra, {
                      cantidadRecibidaInput: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  compact
                />
                <PolariaFormInput
                  id={`rec-temp-${linea.idLineaOrdenCompra}`}
                  label="Temperatura (°C)"
                  inputMode="decimal"
                  value={linea.temperaturaInput}
                  onChange={(event) =>
                    updateLinea(linea.idLineaOrdenCompra, {
                      temperaturaInput: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  compact
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <PolariaFormInput
        id="rec-ubicacion-ingreso"
        label="Ubicación de ingreso (UUID, opcional)"
        value={idUbicacionIngreso}
        onChange={(event) => setIdUbicacionIngreso(event.target.value)}
        disabled={isSubmitting}
        compact
      />

      <PolariaFormField id="rec-notas" label="Notas (opcional)" compact>
        <textarea
          id="rec-notas"
          value={notas}
          onChange={(event) => setNotas(event.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="w-full rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-2 text-sm text-polaria-w placeholder:text-polaria-w-20 outline-none transition focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </PolariaFormField>
    </PolariaFormModal>
  );
}
