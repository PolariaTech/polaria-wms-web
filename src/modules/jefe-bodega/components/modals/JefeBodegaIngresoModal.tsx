"use client";

import { Box, LayoutGrid, MapPin, Package } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import { createJefeOrdenTrabajo } from "../../services/jefe-bodega-orden.service";
import {
  JefeBodegaModalHint,
  JefeBodegaModalNotice,
  JefeBodegaModalSection,
} from "./jefe-bodega-modal-ui";

interface JefeBodegaIngresoModalProps {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  idBodega: string | null;
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[];
  onCreated?: () => void;
}

export function JefeBodegaIngresoModal({
  open,
  onClose,
  codigoCuenta,
  idBodega,
  ubicacionesAlmacen,
  onCreated,
}: JefeBodegaIngresoModalProps) {
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
      setError("Selecciona cuenta, bodega y casillero destino.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createJefeOrdenTrabajo({
        codigoCuenta,
        idBodega,
        tipoFlujo: "a_bodega",
        idUbicacionDestino,
      });
      onCreated?.();
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear la orden.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sinDestinos = ubicacionesAlmacen.length === 0;

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Registrar entrada"
      description="Generar orden de ingreso (a bodega)"
      onSubmit={handleSubmit}
      submitLabel="Crear ingreso"
      submitDisabled={sinDestinos || isSubmitting}
      size="md"
    >
      <JefeBodegaModalSection icon={MapPin} label="Origen">
        <PolariaFormInput
          id="jefe-ingreso-origen"
          label=""
          value="Ingresos"
          readOnly
          aria-label="Origen"
          fieldClassName="[&>label]:sr-only"
        />
      </JefeBodegaModalSection>

      <JefeBodegaModalSection icon={Package} label="Destino en bodega">
        {sinDestinos ? (
          <JefeBodegaModalNotice>
            No hay casilleros de almacenamiento. Cuando el custodio registre
            mercancía en ingreso, podrás crear órdenes hacia bodega.
          </JefeBodegaModalNotice>
        ) : (
          <select
            id="jefe-ingreso-destino"
            value={idUbicacionDestino}
            onChange={(e) => setIdUbicacionDestino(e.target.value)}
            className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2.5 polaria-text-body-sm text-polaria-w"
          >
            <option value="">Seleccionar casillero</option>
            {ubicacionesAlmacen.map((u) => (
              <option key={u.id_ubicacion} value={u.id_ubicacion}>
                {u.codigo}
              </option>
            ))}
          </select>
        )}
        <JefeBodegaModalHint>
          El operario ubicará la mercancía en el casillero que elijas.
        </JefeBodegaModalHint>
      </JefeBodegaModalSection>

      {error ? (
        <p role="alert" className="polaria-text-body-sm text-polaria-danger">
          {error}
        </p>
      ) : null}
    </PolariaFormModal>
  );
}
