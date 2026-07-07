"use client";

import { Box, MapPin } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import { createJefeOrdenTrabajo } from "../../services/jefe-bodega-orden.service";
import { JefeBodegaModalHint, JefeBodegaModalSection } from "./jefe-bodega-modal-ui";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";

interface Props {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  idBodega: string | null;
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[];
  ubicacionesPicking: UbicacionEstadoBodegaDbRow[];
  onCreated?: () => void;
}

export function JefeBodegaSalidaModal({
  open,
  onClose,
  codigoCuenta,
  idBodega,
  ubicacionesAlmacen,
  ubicacionesPicking,
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
    if (!codigoCuenta || !idBodega || !idUbicacionOrigen) {
      setError("Selecciona el casillero de origen en bodega.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createJefeOrdenTrabajo({
        codigoCuenta,
        idBodega,
        tipoFlujo: "a_salida",
        idUbicacionOrigen,
        idUbicacionDestino: idUbicacionDestino || undefined,
      });
      onCreated?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la salida.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Registrar salida"
      description="Orden para mover mercancía de bodega a zona de salida"
      onSubmit={handleSubmit}
      submitLabel="Crear salida"
      submitDisabled={!idUbicacionOrigen || isSubmitting}
      size="md"
    >
      <JefeBodegaModalSection icon={MapPin} label="Origen (bodega)">
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
      <JefeBodegaModalSection icon={Box} label="Destino (salida, opcional)">
        <select
          value={idUbicacionDestino}
          onChange={(e) => setIdUbicacionDestino(e.target.value)}
          className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2.5 polaria-text-body-sm"
        >
          <option value="">Auto / primera libre</option>
          {ubicacionesPicking.map((u) => (
            <option key={u.id_ubicacion} value={u.id_ubicacion}>
              {u.codigo}
            </option>
          ))}
        </select>
        <JefeBodegaModalHint>El operario ejecutará el traslado.</JefeBodegaModalHint>
      </JefeBodegaModalSection>
      {error ? <p className="polaria-text-body-sm text-polaria-danger">{error}</p> : null}
    </PolariaFormModal>
  );
}
