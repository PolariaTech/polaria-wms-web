"use client";

import { useCallback, useEffect, useState } from "react";
import { PolariaFormField } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { cn } from "@/lib/utils/cn";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import {
  getCajaRastreoDetalle,
  listCajasRastreables,
  type CajaMovimientoRastreoRow,
  type CajaRastreableRow,
  type CajaRastreoDetalle,
} from "../services/rastrear-caja.service";
import { RastrearCajaPickerModal } from "./RastrearCajaPickerModal";

interface RastrearCajaModalProps {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  idBodega: string | null;
}

function movimientoPasoLabel(mov: CajaMovimientoRastreoRow): string {
  if (mov.origenCodigo && mov.destinoCodigo) {
    return `${mov.origenCodigo} → ${mov.destinoCodigo}`;
  }
  if (mov.destinoCodigo) return `Hacia ${mov.destinoCodigo}`;
  if (mov.origenCodigo) return `Desde ${mov.origenCodigo}`;
  return "Sin ubicación";
}

export function RastrearCajaModal({
  open,
  onClose,
  codigoCuenta,
  idBodega,
}: RastrearCajaModalProps) {
  const [cajas, setCajas] = useState<CajaRastreableRow[]>([]);
  const [selected, setSelected] = useState<CajaRastreableRow | null>(null);
  const [detalle, setDetalle] = useState<CajaRastreoDetalle | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingCajas, setIsLoadingCajas] = useState(false);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);

  useEffect(() => {
    if (!open) return;

    setSelected(null);
    setDetalle(null);
    setPickerOpen(false);
    setError(null);

    if (!codigoCuenta || !idBodega) {
      setCajas([]);
      return;
    }

    setIsLoadingCajas(true);

    void listCajasRastreables({ codigoCuenta, idBodega })
      .then(setCajas)
      .catch((err: unknown) => {
        setCajas([]);
        setError(
          err instanceof DomainServiceError || err instanceof Error
            ? err.message
            : "No se pudieron cargar las cajas de la bodega.",
        );
      })
      .finally(() => {
        setIsLoadingCajas(false);
      });
  }, [codigoCuenta, idBodega, open]);

  const handleClose = useCallback(() => {
    if (isLoadingDetalle) return;
    onClose();
  }, [isLoadingDetalle, onClose]);

  const handleSelectCaja = useCallback(
    (caja: CajaRastreableRow) => {
      if (!codigoCuenta || !idBodega) return;

      setSelected(caja);
      setDetalle(null);
      setError(null);
      setIsLoadingDetalle(true);

      void getCajaRastreoDetalle({
        codigoCuenta,
        idBodega,
        idLote: caja.idLote,
        caja,
      })
        .then(setDetalle)
        .catch((err: unknown) => {
          setDetalle(null);
          setError(
            err instanceof DomainServiceError || err instanceof Error
              ? err.message
              : "No se pudo cargar el recorrido de la caja.",
          );
        })
        .finally(() => {
          setIsLoadingDetalle(false);
        });
    },
    [codigoCuenta, idBodega],
  );

  const cajaActual = detalle?.caja ?? selected;
  const ubicacionActual =
    cajaActual?.estado === "despachada"
      ? "Despachada (fuera de bodega)"
      : (cajaActual?.ubicacionCodigo ?? "Sin ubicación");

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        sectionLabel="Rastreo"
        title="Rastrear caja"
        description="Ubicación actual y recorrido de movimientos."
        onSubmit={(event) => event.preventDefault()}
        asForm={false}
        error={error}
        isSubmitting={isLoadingDetalle}
        hideFooter
        compact
        size="lg"
        closeOnEscape={!pickerOpen}
      >
        <PolariaFormField id="rastrear-caja-buscar" label="Caja" compact>
          <JefeBodegaModalSearchField
            id="rastrear-caja-buscar"
            value={
              selected
                ? `${selected.codigoLote} · ${selected.productoNombre}`
                : ""
            }
            placeholder={
              isLoadingCajas
                ? "Cargando cajas…"
                : cajas.length === 0
                  ? "Sin cajas en la bodega"
                  : "Buscar caja…"
            }
            ariaLabel="Caja"
            onSearchClick={
              isLoadingCajas || cajas.length === 0
                ? undefined
                : () => setPickerOpen(true)
            }
          />
        </PolariaFormField>

        {!codigoCuenta || !idBodega ? (
          <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
            Selecciona una bodega activa para rastrear cajas.
          </p>
        ) : null}

        {cajaActual ? (
          <section className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 p-4">
            <h3 className="polaria-text-label text-polaria-w-50">
              Ubicación actual
            </h3>
            <p className="mt-2 polaria-text-card-title text-polaria-w">
              {ubicacionActual}
            </p>
            <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <dt className="polaria-text-caption text-polaria-w-50">Estado</dt>
                <dd className="polaria-text-body-sm text-polaria-w">
                  {cajaActual.estadoLabel}
                </dd>
              </div>
              <div>
                <dt className="polaria-text-caption text-polaria-w-50">Peso</dt>
                <dd className="polaria-text-body-sm text-polaria-w">
                  {cajaActual.cantidadLabel}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="polaria-text-caption text-polaria-w-50">
                  Producto
                </dt>
                <dd className="polaria-text-body-sm text-polaria-w">
                  {cajaActual.productoNombre}
                </dd>
              </div>
            </dl>
          </section>
        ) : (
          <p className="rounded-xl border border-dashed border-polaria-w-08 px-4 py-6 text-center polaria-text-body-sm text-polaria-w-50">
            Abrí la lupa para elegir una caja y ver su recorrido.
          </p>
        )}

        {isLoadingDetalle ? (
          <p className="polaria-text-body-sm text-polaria-w-50">
            Cargando recorrido…
          </p>
        ) : null}

        {detalle ? (
          <section>
            <h3 className="polaria-text-label text-polaria-w-50">
              Recorrido / historial
            </h3>

            {detalle.movimientos.length === 0 ? (
              <p className="mt-3 rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
                No hay movimientos registrados para esta caja.
              </p>
            ) : (
              <ol className="mt-3 space-y-2">
                {detalle.movimientos.map((mov, index) => (
                  <li
                    key={mov.idMovimiento}
                    className={cn(
                      "rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="polaria-text-body-sm font-medium text-polaria-w">
                          {index + 1}. {mov.tipoLabel}
                        </p>
                        <p className="mt-1 polaria-text-caption text-polaria-w-50">
                          {movimientoPasoLabel(mov)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="polaria-text-caption text-polaria-teal">
                          {mov.cantidadLabel}
                        </p>
                        <p className="mt-1 polaria-text-caption text-polaria-w-50">
                          {mov.createdAtLabel}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : null}
      </PolariaFormModal>

      <RastrearCajaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        cajas={cajas}
        selectedId={selected?.idLote ?? null}
        onSelect={handleSelectCaja}
      />
    </>
  );
}
