"use client";

import { ArrowLeftRight } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import { createJefeOrdenTrabajo } from "../../services/jefe-bodega-orden.service";
import { JefeBodegaModalSection } from "./jefe-bodega-modal-ui";

interface Props {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  idBodega: string | null;
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[];
  onCreated?: () => void;
}

export function JefeBodegaTransferenciaModal({
  open,
  onClose,
  codigoCuenta,
  idBodega,
  ubicacionesAlmacen,
  onCreated,
}: Props) {
  const [idUbicacionOrigen, setIdUbicacionOrigen] = useState("");
  const [idUbicacionDestino, setIdUbicacionDestino] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!codigoCuenta || !idBodega || !idUbicacionOrigen || !idUbicacionDestino) {
      setError("Selecciona origen y destino.");
      return;
    }
    if (idUbicacionOrigen === idUbicacionDestino) {
      setError("Origen y destino deben ser distintos.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createJefeOrdenTrabajo({
        codigoCuenta,
        idBodega,
        tipoFlujo: "bodega_a_bodega",
        idUbicacionOrigen,
        idUbicacionDestino,
      });
      onCreated?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la orden.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Transferir cajas"
      description="Bodega a bodega dentro del almacenamiento"
      onSubmit={handleSubmit}
      submitLabel="Crear orden"
      submitDisabled={isSubmitting}
      size="md"
    >
      <JefeBodegaModalSection icon={ArrowLeftRight} label="Origen">
        <select
          value={idUbicacionOrigen}
          onChange={(e) => setIdUbicacionOrigen(e.target.value)}
          className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2.5 polaria-text-body-sm"
        >
          <option value="">Casillero origen</option>
          {ubicacionesAlmacen.map((u) => (
            <option key={u.id_ubicacion} value={u.id_ubicacion}>
              {u.codigo}
            </option>
          ))}
        </select>
      </JefeBodegaModalSection>
      <JefeBodegaModalSection icon={ArrowLeftRight} label="Destino">
        <select
          value={idUbicacionDestino}
          onChange={(e) => setIdUbicacionDestino(e.target.value)}
          className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2.5 polaria-text-body-sm"
        >
          <option value="">Casillero destino</option>
          {ubicacionesAlmacen.map((u) => (
            <option key={u.id_ubicacion} value={u.id_ubicacion}>
              {u.codigo}
            </option>
          ))}
        </select>
      </JefeBodegaModalSection>
      {error ? <p className="polaria-text-body-sm text-polaria-danger">{error}</p> : null}
    </PolariaFormModal>
  );
}
