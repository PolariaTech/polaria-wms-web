"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PolariaFormField } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { listBodegasExternasVinculadasAdmin } from "@/modules/admin-panel";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import {
  TIPO_INTEGRACION_LABELS,
  type TipoIntegracion,
} from "../constants/integration-types";
import { createSolicitudIntegracion } from "../services/integracion-bodega.service";
import {
  IntegracionBodegaExternaPickerModal,
  type IntegracionBodegaOption,
} from "./IntegracionBodegaExternaPickerModal";
import { IntegracionTipoPickerModal } from "./IntegracionTipoPickerModal";

interface SolicitudIntegracionCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function SolicitudIntegracionCreateModal({
  open,
  onClose,
  onCreated,
}: SolicitudIntegracionCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const idSolicitante = useAuthStore((state) => state.session?.idUsuario ?? "");
  const [idBodega, setIdBodega] = useState("");
  const [tipoIntegracion, setTipoIntegracion] =
    useState<TipoIntegracion>("scraping");
  const [bodegas, setBodegas] = useState<IntegracionBodegaOption[]>([]);
  const [bodegaPickerOpen, setBodegaPickerOpen] = useState(false);
  const [tipoPickerOpen, setTipoPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBodegas, setIsLoadingBodegas] = useState(false);

  const selectedBodegaLabel = useMemo(() => {
    if (!idBodega) return "";
    return bodegas.find((row) => row.id === idBodega)?.nombre ?? "";
  }, [bodegas, idBodega]);

  useEffect(() => {
    if (!open) return;

    setIdBodega("");
    setTipoIntegracion("scraping");
    setBodegaPickerOpen(false);
    setTipoPickerOpen(false);
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

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

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

  const disabled = isSubmitting || isLoadingBodegas;
  const anyPickerOpen = bodegaPickerOpen || tipoPickerOpen;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        title="Solicitar integración"
        description="Registra una nueva solicitud de integración con bodega externa."
        onSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel="Solicitar integración"
        closeOnEscape={!anyPickerOpen}
      >
        <PolariaFormField id="solicitud-integracion-bodega" label="Bodega externa">
          <JefeBodegaModalSearchField
            id="solicitud-integracion-bodega"
            value={selectedBodegaLabel}
            placeholder={
              isLoadingBodegas
                ? "Cargando bodegas…"
                : bodegas.length === 0
                  ? "Sin bodegas externas"
                  : "Selecciona una bodega externa"
            }
            ariaLabel="Bodega externa"
            onSearchClick={
              disabled || bodegas.length === 0
                ? undefined
                : () => setBodegaPickerOpen(true)
            }
          />
        </PolariaFormField>

        <PolariaFormField
          id="solicitud-integracion-tipo"
          label="Tipo de integración"
        >
          <JefeBodegaModalSearchField
            id="solicitud-integracion-tipo"
            value={TIPO_INTEGRACION_LABELS[tipoIntegracion]}
            placeholder="Selecciona un tipo"
            ariaLabel="Tipo de integración"
            onSearchClick={
              isSubmitting ? undefined : () => setTipoPickerOpen(true)
            }
          />
        </PolariaFormField>
      </PolariaFormModal>

      <IntegracionBodegaExternaPickerModal
        open={bodegaPickerOpen}
        onClose={() => setBodegaPickerOpen(false)}
        bodegas={bodegas}
        selectedId={idBodega || null}
        onSelect={(bodega) => {
          setIdBodega(bodega.id);
          setError(null);
        }}
      />

      <IntegracionTipoPickerModal
        open={tipoPickerOpen}
        onClose={() => setTipoPickerOpen(false)}
        selectedId={tipoIntegracion}
        onSelect={(tipo) => {
          setTipoIntegracion(tipo);
          setError(null);
        }}
      />
    </>
  );
}
