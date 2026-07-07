"use client";

import { Search } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import { createJefeOrdenTrabajo } from "../../services/jefe-bodega-orden.service";
import { JefeBodegaModalHint, JefeBodegaModalSection } from "./jefe-bodega-modal-ui";

interface Props {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  idBodega: string | null;
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[];
  onCreated?: () => void;
}

export function JefeBodegaRevisarModal({
  open,
  onClose,
  codigoCuenta,
  idBodega,
  ubicacionesAlmacen,
  onCreated,
}: Props) {
  const [idUbicacionDestino, setIdUbicacionDestino] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!codigoCuenta || !idBodega || !idUbicacionDestino) {
      setError("Selecciona la posición a revisar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createJefeOrdenTrabajo({
        codigoCuenta,
        idBodega,
        tipoFlujo: "revisar",
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
      title="Revisar posición"
      description="Orden de conteo / revisión de casillero"
      onSubmit={handleSubmit}
      submitLabel="Crear revisión"
      submitDisabled={!idUbicacionDestino || isSubmitting}
      size="md"
    >
      <JefeBodegaModalSection icon={Search} label="Posición">
        <select
          value={idUbicacionDestino}
          onChange={(e) => setIdUbicacionDestino(e.target.value)}
          className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2.5 polaria-text-body-sm"
        >
          <option value="">Seleccionar casillero</option>
          {ubicacionesAlmacen.map((u) => (
            <option key={u.id_ubicacion} value={u.id_ubicacion}>
              {u.codigo}
            </option>
          ))}
        </select>
        <JefeBodegaModalHint>El operario marcará la revisión como completada.</JefeBodegaModalHint>
      </JefeBodegaModalSection>
      {error ? <p className="polaria-text-body-sm text-polaria-danger">{error}</p> : null}
    </PolariaFormModal>
  );
}
