"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormSelect } from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { listBodegasExternasVinculadasAdmin } from "@/modules/admin-panel";
import { useCompany } from "@/providers/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import { TIPOS_INTEGRACION, type TipoIntegracion } from "../constants/integration-types";
import { createSolicitudIntegracion } from "../services/integracion-bodega.service";

interface SolicitudIntegracionCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface BodegaOption {
  id: string;
  nombre: string;
}

export function SolicitudIntegracionCreateModal({
  open,
  onClose,
  onCreated,
}: SolicitudIntegracionCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const idSolicitante = useAuthStore((state) => state.session?.idUsuario ?? "");
  const [idBodega, setIdBodega] = useState("");
  const [tipoIntegracion, setTipoIntegracion] = useState<TipoIntegracion>("scraping");
  const [bodegas, setBodegas] = useState<BodegaOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBodegas, setIsLoadingBodegas] = useState(false);

  useEffect(() => {
    if (!open) return;

    setIdBodega("");
    setTipoIntegracion("scraping");
    setError(null);
    setIsSubmitting(false);

    if (!codigoCuenta) return;

    setIsLoadingBodegas(true);

    void listBodegasExternasVinculadasAdmin({ codigoCuenta })
      .then((rows) => {
        setBodegas(
          rows.map((row) => ({
            id: row.idBodega,
            nombre: row.nombre,
          })),
        );
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las bodegas externas.",
        );
      })
      .finally(() => {
        setIsLoadingBodegas(false);
      });
  }, [codigoCuenta, open]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!codigoCuenta) {
        setError("No se encontró la cuenta activa.");
        return;
      }

      if (!idSolicitante) {
        setError("No se encontró el usuario solicitante.");
        return;
      }

      const bodega = bodegas.find((item) => item.id === idBodega);
      if (!bodega) {
        setError("Selecciona una bodega externa.");
        return;
      }

      setError(null);
      setIsSubmitting(true);

      try {
        await createSolicitudIntegracion({
          codigoCuenta,
          idSolicitante,
          bodegaExternaId: bodega.id,
          bodegaExternaNombre: bodega.nombre,
          tipoIntegracion,
        });
        onCreated();
        onClose();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo registrar la solicitud de integración.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      bodegas,
      codigoCuenta,
      idBodega,
      idSolicitante,
      onClose,
      onCreated,
      tipoIntegracion,
    ],
  );

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title="Solicitar integración"
      description="Registra una nueva solicitud de integración con bodega externa."
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Solicitar integración"
    >
      <PolariaFormSelect
        id="solicitud-integracion-bodega"
        label="Bodega externa"
        value={idBodega}
        onChange={(event) => setIdBodega(event.target.value)}
        disabled={isLoadingBodegas || isSubmitting || bodegas.length === 0}
        placeholder={
          isLoadingBodegas ? "Cargando bodegas…" : "Selecciona una bodega externa"
        }
        options={bodegas.map((bodega) => ({
          value: bodega.id,
          label: bodega.nombre,
        }))}
        required
      />

      <PolariaFormSelect
        id="solicitud-integracion-tipo"
        label="Tipo de integración"
        value={tipoIntegracion}
        onChange={(event) =>
          setTipoIntegracion(event.target.value as TipoIntegracion)
        }
        disabled={isSubmitting}
        options={TIPOS_INTEGRACION.map((tipo) => ({
          value: tipo.value,
          label: tipo.label,
        }))}
        required
      />
    </PolariaFormModal>
  );
}
