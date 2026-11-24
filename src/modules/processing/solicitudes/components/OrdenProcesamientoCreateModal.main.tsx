"use client";

import { createPortal } from "react-dom";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { ProcesamientoMapaPickerModal } from "./ProcesamientoMapaPickerModal";
import { ProcesamientoProductoPickerModal } from "./ProcesamientoProductoPickerModal";
import { ProcesamientoResultadoPickerModal } from "./ProcesamientoResultadoPickerModal";
import {
  formatBodegaLabel,
  formatDisplayDate,
} from "./orden-procesamiento-create-modal.helpers";
import {
  ProcesamientoCantidadBody,
  ProcesamientoEstimadoBody,
  ProcesamientoFieldBox,
} from "./orden-procesamiento-create-modal.ui";
import { useOrdenProcesamientoCreateForm } from "./useOrdenProcesamientoCreateForm";

interface OrdenProcesamientoCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function OrdenProcesamientoCreateModal({
  open,
  onClose,
  onCreated,
}: OrdenProcesamientoCreateModalProps) {
  const {
    codigoCuenta,
    fecha,
    setFecha,
    bodegas,
    idBodega,
    idPrimario,
    idSecundario,
    conversionUnidades,
    setConversionUnidades,
    cantidadElegida,
    setCantidadElegida,
    primarios,
    secundarioSeleccionado,
    stockKg,
    stockLoading,
    stockError,
    error,
    isSubmitting,
    isLoading,
    mapaPickerOpen,
    setMapaPickerOpen,
    insumoPickerOpen,
    setInsumoPickerOpen,
    resultadoPickerOpen,
    setResultadoPickerOpen,
    primarioSeleccionado,
    maxCantidad,
    perdidaPctDelCatalogo,
    desgloseEstimado,
    insumoValido,
    bodegaSeleccionada,
    nestedPickerOpen,
    fieldsDisabled,
    cantidadLista,
    handleMapaSelect,
    handleInsumoSelect,
    handleResultadoSelect,
    handleSubmit,
  } = useOrdenProcesamientoCreateForm({ open, onClose, onCreated });

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={onClose}
        title="Nueva orden de procesamiento"
        description="INSUMO → RESULTADO"
        onSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel="Confirmar y enviar a bodega"
        compact
        size="lg"
        hideHeaderClose
        closeOnEscape={!nestedPickerOpen}
      >
        <div className="flex flex-col gap-2">
          <label
            htmlFor="orden-procesamiento-fecha"
            className="polaria-text-label text-polaria-w-50"
          >
            Fecha
          </label>
          <input
            id="orden-procesamiento-fecha"
            type="date"
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 text-polaria-w outline-none transition focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="polaria-text-body-sm text-polaria-w-50">
            {formatDisplayDate(fecha)}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="polaria-text-label text-polaria-w-50">Mapa</span>
          <JefeBodegaModalSearchField
            id="orden-procesamiento-mapa"
            value={bodegaSeleccionada ? formatBodegaLabel(bodegaSeleccionada) : ""}
            placeholder={
              isLoading ? "Cargando bodegas…" : "Seleccionar bodega interna"
            }
            ariaLabel="Mapa"
            onSearchClick={
              fieldsDisabled || bodegas.length === 0
                ? undefined
                : () => setMapaPickerOpen(true)
            }
          />
        </div>

        {bodegas.length === 0 && !isLoading ? (
          <p className="rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-3 py-2 polaria-text-body-sm text-polaria-warning">
            No hay bodegas internas vinculadas a la cuenta.
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="polaria-text-label text-polaria-w-50">Insumo</span>
          <JefeBodegaModalSearchField
            id="orden-procesamiento-insumo"
            value={primarioSeleccionado?.label ?? ""}
            placeholder={
              isLoading
                ? "Cargando insumos…"
                : !idBodega
                  ? "Selecciona un mapa primero"
                  : primarios.length === 0
                    ? "Sin productos con primario y secundario"
                    : "Seleccionar insumo primario"
            }
            ariaLabel="Insumo"
            onSearchClick={
              fieldsDisabled || !idBodega || primarios.length === 0
                ? undefined
                : () => setInsumoPickerOpen(true)
            }
          />
          {idPrimario ? (
            <p className="polaria-text-caption text-polaria-w-50">
              {stockLoading
                ? "Consultando stock del mapa…"
                : stockError
                  ? stockError
                  : insumoValido
                    ? `Stock: ${Math.floor(stockKg ?? 0).toLocaleString("es-CL")} kg`
                    : "Sin stock de almacenamiento en el mapa seleccionado."}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <span className="polaria-text-label text-polaria-w-50">Resultado</span>
          <JefeBodegaModalSearchField
            id="orden-procesamiento-resultado"
            value={secundarioSeleccionado?.label ?? ""}
            placeholder={
              !idPrimario
                ? "Elegí insumo primero"
                : "Seleccionar resultado secundario"
            }
            ariaLabel="Resultado"
            onSearchClick={
              fieldsDisabled || !idPrimario
                ? undefined
                : () => setResultadoPickerOpen(true)
            }
          />
        </div>

        <ProcesamientoFieldBox label="Conversión">
          <div className="flex flex-wrap items-center gap-2 polaria-text-body-sm text-polaria-w">
            <span>1 kg →</span>
            <input
              type="text"
              inputMode="decimal"
              value={conversionUnidades}
              onChange={(event) => setConversionUnidades(event.target.value)}
              disabled={isSubmitting || !idSecundario}
              placeholder="0"
              aria-label="Unidades de secundario por 1 kg de primario"
              className="w-20 rounded-lg border border-polaria-w-08 bg-polaria-bg px-2 py-1.5 text-center text-polaria-w outline-none focus:border-polaria-t-20 disabled:opacity-60"
            />
            <span className="text-polaria-w-50">ud.</span>
          </div>
        </ProcesamientoFieldBox>

        <ProcesamientoFieldBox label="Cantidad a procesar (kg)">
          <ProcesamientoCantidadBody
            idBodega={idBodega}
            stockLoading={stockLoading}
            maxCantidad={maxCantidad}
            cantidadElegida={cantidadElegida}
            setCantidadElegida={setCantidadElegida}
            isSubmitting={isSubmitting}
            cantidadLista={cantidadLista}
          />
        </ProcesamientoFieldBox>

        <ProcesamientoFieldBox label="Estimado">
          <ProcesamientoEstimadoBody
            desgloseEstimado={desgloseEstimado}
            perdidaPctDelCatalogo={perdidaPctDelCatalogo}
          />
        </ProcesamientoFieldBox>
      </PolariaFormModal>

      {typeof document !== "undefined"
        ? createPortal(
            <>
              <ProcesamientoMapaPickerModal
                open={mapaPickerOpen}
                onClose={() => setMapaPickerOpen(false)}
                bodegas={bodegas}
                selectedId={idBodega || null}
                onSelect={handleMapaSelect}
              />
              <ProcesamientoProductoPickerModal
                open={insumoPickerOpen}
                onClose={() => setInsumoPickerOpen(false)}
                title="Seleccionar insumo"
                description="Solo productos primarios con al menos un secundario vinculado."
                productos={primarios}
                isLoading={isLoading}
                selectedId={idPrimario || null}
                emptyMessage="No hay productos con primario y secundario en el catálogo."
                onSelect={handleInsumoSelect}
              />
              <ProcesamientoResultadoPickerModal
                open={resultadoPickerOpen}
                onClose={() => setResultadoPickerOpen(false)}
                codigoCuenta={codigoCuenta}
                idProductoPrimario={idPrimario || null}
                primarioLabel={primarioSeleccionado?.label}
                selectedId={idSecundario || null}
                onSelect={handleResultadoSelect}
              />
            </>,
            document.body,
          )
        : null}
    </>
  );
}
