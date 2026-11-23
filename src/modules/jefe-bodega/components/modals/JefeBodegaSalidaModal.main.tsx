"use client";

import { Box, MapPin } from "lucide-react";
import { type FormEvent, useCallback, useMemo, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import type { JefeBodegaSalidaOrdenVentaPrefill } from "../../types/jefe-bodega-salida.types";
import { createJefeOrdenTrabajo } from "../../services/jefe-bodega-orden.service";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
import { resolveSalidaProductoDesdeOrden } from "../../utils/salida-orden-venta";
import { useJefeBodegaOperarioAsignacion } from "../../hooks/useJefeBodegaOperarioAsignacion";
import {
  JefeBodegaModalHint,
  JefeBodegaModalNotice,
  JefeBodegaModalSearchField,
  JefeBodegaModalSection,
} from "./jefe-bodega-modal-ui";
import { buildSalidaDestinoOptions } from "./jefe-bodega-salida-modal.helpers";
import { useJefeBodegaSalidaOrigen } from "./useJefeBodegaSalidaOrigen";
import { JefeBodegaOperarioPicker } from "./JefeBodegaOperarioPicker";
import { JefeBodegaOrdenVentaPickerModal } from "./JefeBodegaOrdenVentaPickerModal";
import { JefeBodegaSalidaProductosSection } from "./JefeBodegaSalidaProductosSection";
import {
  JefeBodegaSlotPickerModal,
  type JefeBodegaSlotPickerOption,
} from "./JefeBodegaSlotPickerModal";

interface Props {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  idBodega: string | null;
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[];
  ubicacionesPicking: UbicacionEstadoBodegaDbRow[];
  prefillOrdenVenta?: JefeBodegaSalidaOrdenVentaPrefill | null;
  onCreated?: () => void;
}

type PickerKind = "origen" | "destino" | null;

export function JefeBodegaSalidaModal({
  open,
  onClose,
  codigoCuenta,
  idBodega,
  ubicacionesAlmacen,
  ubicacionesPicking,
  prefillOrdenVenta = null,
  onCreated,
}: Props) {
  const [idUbicacionDestino, setIdUbicacionDestino] = useState("");
  const [destinoLabel, setDestinoLabel] = useState("");
  const [picker, setPicker] = useState<PickerKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const operarioAsignacion = useJefeBodegaOperarioAsignacion({
    open,
    codigoCuenta,
    idBodega,
  });

  const {
    idOrdenVenta,
    origenLabel,
    idUbicacionOrigen,
    ordenDetalle,
    loadingDetalle,
    ordenesConfirmadas,
    loadingOrdenes,
    codigoByUbicacion,
    applyOrdenSeleccionada,
    resetOrigen,
  } = useJefeBodegaSalidaOrigen({
    open,
    codigoCuenta,
    idBodega,
    ubicacionesAlmacen,
    prefillOrdenVenta,
    setError,
  });

  const resetForm = useCallback(() => {
    resetOrigen();
    setIdUbicacionDestino("");
    setDestinoLabel("");
    setError(null);
    setPicker(null);
  }, [resetOrigen]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const destinoOptions = useMemo<JefeBodegaSlotPickerOption[]>(
    () => buildSalidaDestinoOptions(ubicacionesPicking),
    [ubicacionesPicking],
  );

  const canSubmit = Boolean(
    codigoCuenta &&
      idBodega &&
      idOrdenVenta &&
      idUbicacionOrigen &&
      idUbicacionDestino &&
      operarioAsignacion.canAssign,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !codigoCuenta || !idBodega) {
      setError(
        operarioAsignacion.blockReason ??
          (idOrdenVenta && !idUbicacionOrigen
            ? "No se encontró casillero de origen en almacenamiento para esta venta."
            : "Selecciona la orden de venta y el slot de salida."),
      );
      return;
    }

    const orden =
      ordenesConfirmadas.find((row) => row.idOrdenVenta === idOrdenVenta) ??
      (ordenDetalle
        ? {
            idOrdenVenta,
            venta: ordenDetalle.codigo,
          }
        : null);

    const productoSalida = resolveSalidaProductoDesdeOrden(ordenDetalle);
    if (!productoSalida) {
      setError("No se pudo determinar el producto y la cantidad de la venta.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let idLote: string | undefined;
      try {
        const stock = await listWarehouseState({
          codigoCuenta,
          idBodega,
          limit: 500,
        });
        const row = stock.find(
          (item) =>
            item.id_ubicacion === idUbicacionOrigen &&
            item.id_producto === productoSalida.idProducto,
        );
        idLote = row?.id_lote ?? undefined;
      } catch {
        idLote = undefined;
      }

      await createJefeOrdenTrabajo({
        codigoCuenta,
        idBodega,
        tipoFlujo: "a_salida",
        idUbicacionOrigen,
        idUbicacionDestino,
        idProducto: productoSalida.idProducto,
        cantidad: productoSalida.cantidad,
        idLote,
        idAsignado: operarioAsignacion.idAsignado ?? undefined,
        idOrdenVenta: idOrdenVenta.trim(),
        observaciones: orden ? `OV ${orden.venta}` : undefined,
      });
      onCreated?.();
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear la salida.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sinOrdenes = !loadingOrdenes && ordenesConfirmadas.length === 0;
  const sinDestinos = ubicacionesPicking.length === 0;
  const origenBloqueado = Boolean(prefillOrdenVenta && idOrdenVenta);
  const origenSlotCodigo = idUbicacionOrigen
    ? codigoByUbicacion.get(idUbicacionOrigen)
    : null;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        title="Registrar salida"
        description="Orden para mover mercancía de bodega a zona de salida"
        onSubmit={handleSubmit}
        submitLabel="Crear salida"
        submitDisabled={!canSubmit || isSubmitting}
        hideHeaderClose
        size="md"
      >
        <JefeBodegaModalSection icon={MapPin} label="Origen (orden de venta)">
          {sinOrdenes && !idOrdenVenta ? (
            <JefeBodegaModalNotice>
              No hay órdenes de venta confirmadas disponibles para registrar
              salida.
            </JefeBodegaModalNotice>
          ) : (
            <JefeBodegaModalSearchField
              id="jefe-salida-origen"
              value={origenLabel}
              placeholder="Seleccionar orden de venta"
              ariaLabel="Orden de venta origen"
              onSearchClick={
                origenBloqueado ? undefined : () => setPicker("origen")
              }
            />
          )}
        </JefeBodegaModalSection>

        <JefeBodegaSalidaProductosSection
          orden={ordenDetalle}
          loading={loadingDetalle}
        />
        {origenSlotCodigo ? (
          <JefeBodegaModalHint>
            Casillero de origen en almacenamiento: {origenSlotCodigo}
          </JefeBodegaModalHint>
        ) : null}

        <JefeBodegaModalSection icon={Box} label="Destino (salida)">
          {sinDestinos ? (
            <JefeBodegaModalNotice>
              No hay slots de salida configurados en esta bodega.
            </JefeBodegaModalNotice>
          ) : (
            <JefeBodegaModalSearchField
              id="jefe-salida-destino"
              value={destinoLabel}
              placeholder="Seleccionar slot de salida"
              ariaLabel="Destino en zona de salida"
              onSearchClick={() => setPicker("destino")}
            />
          )}
          <JefeBodegaModalHint>El operario ejecutará el traslado.</JefeBodegaModalHint>
        </JefeBodegaModalSection>

        <JefeBodegaOperarioPicker asignacion={operarioAsignacion} />

        {error ? (
          <p role="alert" className="polaria-text-body-sm text-polaria-danger">
            {error}
          </p>
        ) : null}
      </PolariaFormModal>

      <JefeBodegaOrdenVentaPickerModal
        open={picker === "origen"}
        onClose={() => setPicker(null)}
        ordenes={ordenesConfirmadas}
        loading={loadingOrdenes}
        selectedId={idOrdenVenta || null}
        onSelect={(orden) => {
          void applyOrdenSeleccionada(orden);
        }}
      />

      <JefeBodegaSlotPickerModal
        open={picker === "destino"}
        onClose={() => setPicker(null)}
        title="Seleccionar destino"
        description="Slots de la zona de salida."
        options={destinoOptions}
        selectedId={idUbicacionDestino || null}
        emptyMessage="No hay slots de salida configurados."
        onSelect={(option) => {
          setIdUbicacionDestino(option.id);
          setDestinoLabel(option.title);
          setError(null);
        }}
      />
    </>
  );
}
