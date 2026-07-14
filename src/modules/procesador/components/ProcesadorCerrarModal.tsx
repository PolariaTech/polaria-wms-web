"use client";

import { Cpu, Scale } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import {
  formatKilos,
  formatUnidades,
} from "@/modules/processing/shared/constants/processing-status";
import {
  cerrarSolicitudProcesamiento,
  crearOrdenesPostCierre,
  getDesperdicioSugeridoDetalle,
} from "@/modules/processing";
import type { SolicitudProcesamientoOperadorRow } from "@/modules/processing";
import type { DesperdicioSugeridoDetalle } from "@/modules/processing/shared/utils/desperdicio-kg-sugerido";
import { stringKgInicialDesperdicio } from "@/modules/processing/shared/utils/desperdicio-kg-sugerido";
import {
  JefeBodegaModalHint,
  JefeBodegaModalSection,
} from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";

interface Props {
  open: boolean;
  onClose: () => void;
  solicitud: SolicitudProcesamientoOperadorRow | null;
  codigoCuenta: string | null;
  idBodega: string | null;
  onClosed?: () => void;
}

export function ProcesadorCerrarModal({
  open,
  onClose,
  solicitud,
  codigoCuenta,
  idBodega,
  onClosed,
}: Props) {
  const [kilosMerma, setKilosMerma] = useState("0");
  const [mermaDetalle, setMermaDetalle] = useState<DesperdicioSugeridoDetalle | null>(
    null,
  );
  const [loadingSugerido, setLoadingSugerido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = useCallback(() => {
    setKilosMerma("0");
    setMermaDetalle(null);
    setError(null);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open || !solicitud) {
      reset();
      return;
    }

    let cancelled = false;
    setLoadingSugerido(true);

    void getDesperdicioSugeridoDetalle(solicitud.idSolicitudProcesamiento)
      .then((detalle) => {
        if (cancelled) return;
        setMermaDetalle(detalle);
        setKilosMerma(stringKgInicialDesperdicio(detalle.desperdicioKg));
      })
      .catch(() => {
        if (cancelled) return;
        setMermaDetalle(null);
        setKilosMerma("0");
      })
      .finally(() => {
        if (!cancelled) setLoadingSugerido(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, reset, solicitud]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit =
    Boolean(solicitud) &&
    Boolean(codigoCuenta?.trim()) &&
    Boolean(idBodega?.trim()) &&
    !isSubmitting &&
    !loadingSugerido;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !solicitud || !codigoCuenta?.trim() || !idBodega?.trim()) {
      return;
    }

    const merma = Number(String(kilosMerma).replace(",", ".").trim());
    if (!Number.isFinite(merma) || merma < 0) {
      setError("Indica la merma en kg (puede ser 0).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await cerrarSolicitudProcesamiento(solicitud.idSolicitudProcesamiento, {
        codigoCuenta: codigoCuenta.trim(),
        idBodega: idBodega.trim(),
        kilosMerma: merma,
      });

      await crearOrdenesPostCierre(solicitud.idSolicitudProcesamiento, {
        codigoCuenta: codigoCuenta.trim(),
        idBodega: idBodega.trim(),
      });

      onClosed?.();
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cerrar la orden de procesamiento.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const kilosPrimario =
    mermaDetalle?.kilosPrimario ??
    Number.parseFloat(solicitud?.insumoPrimario ?? "");
  const perdidaPct = mermaDetalle?.perdidaPct;
  const mermaSugerida = mermaDetalle?.desperdicioKg;

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Declarar merma y cerrar"
      description="Revisá el kg sugerido y confirmá."
      onSubmit={handleSubmit}
      submitLabel="Confirmar cierre"
      submitDisabled={!canSubmit}
      hideHeaderClose
      size="md"
    >
      <JefeBodegaModalSection icon={Cpu} label="Orden">
        {solicitud ? (
          <div className="rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-4 py-3">
            <p className="polaria-text-body-sm font-semibold text-polaria-w">
              {solicitud.orden}
            </p>
            <p className="mt-1 polaria-text-caption text-polaria-w-50">
              {solicitud.primario} → {solicitud.secundario}
            </p>
            <p className="mt-1 polaria-text-caption text-polaria-teal">
              {formatKilos(solicitud.insumoPrimario)} · est.{" "}
              {formatUnidades(solicitud.estimSecundario)} ud.
            </p>
          </div>
        ) : null}
      </JefeBodegaModalSection>

      <JefeBodegaModalSection icon={Scale} label="Merma (kg)">
        {loadingSugerido ? (
          <JefeBodegaModalHint>Calculando sugerido…</JefeBodegaModalHint>
        ) : null}

        {!loadingSugerido &&
        mermaSugerida != null &&
        perdidaPct != null &&
        perdidaPct > 0 ? (
          <p className="polaria-text-caption text-polaria-w-50">
            Sugerido:{" "}
            <span className="font-medium text-polaria-w">
              {Number.isFinite(kilosPrimario)
                ? formatKilos(String(kilosPrimario))
                : "—"}{" "}
              × {perdidaPct.toLocaleString("es-CL", { maximumFractionDigits: 1 })}% ={" "}
              {mermaSugerida.toLocaleString("es-CL", { maximumFractionDigits: 2 })} kg
            </span>
          </p>
        ) : null}

        {!loadingSugerido && (perdidaPct == null || perdidaPct <= 0) ? (
          <JefeBodegaModalHint>Ingresá la merma en kg.</JefeBodegaModalHint>
        ) : null}

        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Kilogramos de merma"
          placeholder="0"
          value={kilosMerma}
          onChange={(e) => setKilosMerma(e.target.value)}
          disabled={loadingSugerido || isSubmitting}
          className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm font-mono text-polaria-w outline-none focus:border-polaria-teal"
        />
      </JefeBodegaModalSection>

      {error ? (
        <p role="alert" className="polaria-text-body-sm text-polaria-danger">
          {error}
        </p>
      ) : null}
    </PolariaFormModal>
  );
}
