"use client";

import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import type { ViajeEntregaRow } from "../../shared/types/transport.types";
import { TransporteEntregaPasoConformidad } from "./TransporteEntregaPasoConformidad";
import { TransporteEntregaPasoFirma } from "./TransporteEntregaPasoFirma";
import { TransporteEntregaPasoFoto } from "./TransporteEntregaPasoFoto";
import { TransporteEntregaPasoProductos } from "./TransporteEntregaPasoProductos";
import { PASOS_ENTREGA } from "./transporte-entrega.helpers";
import { useTransporteEntrega } from "./useTransporteEntrega";

interface TransporteEntregaModalProps {
  open: boolean;
  viaje: ViajeEntregaRow | null;
  codigoCuenta: string | null;
  idBodega: string | null;
  onClose: () => void;
  onEntregado: () => void;
}

export function TransporteEntregaModalContent({
  open,
  viaje,
  codigoCuenta,
  idBodega,
  onClose,
  onEntregado,
}: TransporteEntregaModalProps) {
  const entrega = useTransporteEntrega({
    open,
    viaje,
    codigoCuenta,
    idBodega,
    onClose,
    onEntregado,
  });
  const {
    paso,
    detalle,
    loadingDetalle,
    detalleError,
    error,
    saving,
    firma,
  } = entrega;

  const title = viaje
    ? `Entrega · ${viaje.codigoViaje}`
    : "Realizar entrega";

  return (
    <PolariaFormModal
      open={open}
      onClose={entrega.handleClose}
      title={title}
      description={
        viaje
          ? `${viaje.codigoVenta} · ${viaje.clienteNombre}`
          : "Completá los pasos de evidencia."
      }
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideHeaderClose
      compact
      size="lg"
      error={error}
      isSubmitting={saving}
      footerAction={
        <div className="flex flex-row flex-wrap items-center justify-end gap-2">
          {paso > 0 ? (
            <button
              type="button"
              disabled={saving}
              onClick={entrega.handleBack}
              className="rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-4 py-2.5 polaria-text-body-sm font-medium text-polaria-w transition hover:border-polaria-teal hover:text-polaria-teal disabled:opacity-50"
            >
              Anterior
            </button>
          ) : null}
          {paso < PASOS_ENTREGA - 1 ? (
            <button
              type="button"
              disabled={saving || loadingDetalle || !detalle}
              onClick={entrega.handleNext}
              className="rounded-xl bg-polaria-teal px-4 py-2.5 polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90 disabled:opacity-50"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || loadingDetalle || !detalle}
              onClick={() => void entrega.handleEntregar()}
              className="rounded-xl bg-polaria-teal px-4 py-2.5 polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Cerrando…" : "Cerrar entrega"}
            </button>
          )}
        </div>
      }
      cancelLabel="Cancelar"
    >
      <p className="mb-3 text-center polaria-text-caption font-semibold uppercase tracking-wide text-polaria-w-50">
        Paso {paso + 1} de {PASOS_ENTREGA}
      </p>

      {loadingDetalle ? (
        <PolariaStatusLoading
          embedded
          title="Cargando productos…"
          message="Estamos preparando los productos de la entrega."
          className="py-4"
        />
      ) : null}

      {detalleError ? (
        <p className="rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-3 py-3 polaria-text-body-sm text-polaria-danger">
          {detalleError}
        </p>
      ) : null}

      {!loadingDetalle && !detalleError && detalle && paso === 0 ? (
        <TransporteEntregaPasoProductos
          lineas={detalle.lineas}
          lineaVerificada={entrega.lineaVerificada}
          cantidades={entrega.cantidades}
          onToggleLinea={(index, checked) =>
            entrega.setLineaVerificada((prev) => ({
              ...prev,
              [index]: checked,
            }))
          }
          onChangeCantidad={(index, value) =>
            entrega.setCantidades((prev) => ({
              ...prev,
              [index]: value,
            }))
          }
        />
      ) : null}

      {!loadingDetalle && !detalleError && paso === 1 ? (
        <TransporteEntregaPasoFoto
          hasFoto={Boolean(entrega.fotoFile)}
          fotoPreview={entrega.fotoPreview}
          onFotoChange={entrega.onFotoChange}
        />
      ) : null}

      {!loadingDetalle && !detalleError && paso === 2 ? (
        <TransporteEntregaPasoFirma
          canvasRef={firma.canvasRef}
          onPointerDown={firma.handlePointerDown}
          onPointerMove={firma.handlePointerMove}
          onPointerUp={firma.handlePointerUp}
          onClear={firma.clearFirma}
        />
      ) : null}

      {!loadingDetalle && !detalleError && paso === 3 ? (
        <TransporteEntregaPasoConformidad
          conforme={entrega.conforme}
          descripcion={entrega.descripcion}
          onConforme={() => {
            entrega.setConforme(true);
            entrega.setDescripcion("");
          }}
          onNoConforme={() => entrega.setConforme(false)}
          onChangeDescripcion={entrega.setDescripcion}
        />
      ) : null}
    </PolariaFormModal>
  );
}
