"use client";

import { LayoutGrid, MapPin } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { createJefeOrdenTrabajo } from "../../services/jefe-bodega-orden.service";
import { useJefeBodegaOperarioAsignacion } from "../../hooks/useJefeBodegaOperarioAsignacion";
import { useJefeBodegaUbicacionesBloqueadas } from "../../hooks/useJefeBodegaUbicacionesBloqueadas";
import {
  JefeBodegaModalHint,
  JefeBodegaModalNotice,
  JefeBodegaModalSearchField,
  JefeBodegaModalSection,
} from "./jefe-bodega-modal-ui";
import { JefeBodegaOperarioPicker } from "./JefeBodegaOperarioPicker";
import {
  JefeBodegaSlotPickerModal,
  type JefeBodegaSlotPickerOption,
} from "./JefeBodegaSlotPickerModal";
import {
  buildTransferenciaObservaciones,
  resolveOrigenSeleccion,
} from "./jefe-bodega-transferencia-modal.origen";
import { JefeBodegaTransferenciaOrigenToolbar } from "./jefe-bodega-transferencia-modal.toolbar";
import type {
  JefeBodegaTransferenciaModalProps,
  OrigenMeta,
  OrigenZona,
  TransferenciaPickerKind,
} from "./jefe-bodega-transferencia-modal.types";
import { useJefeBodegaTransferenciaData } from "./useJefeBodegaTransferenciaData";
import { useJefeBodegaTransferenciaOptions } from "./useJefeBodegaTransferenciaOptions";

export function JefeBodegaTransferenciaModal({
  open,
  onClose,
  codigoCuenta,
  idBodega,
  ubicacionesAlmacen,
  ubicacionesProcesamiento,
  onCreated,
}: JefeBodegaTransferenciaModalProps) {
  const [idUbicacionOrigen, setIdUbicacionOrigen] = useState("");
  const [origenLabel, setOrigenLabel] = useState("");
  const [origenMeta, setOrigenMeta] = useState<OrigenMeta | null>(null);
  const [idUbicacionDestino, setIdUbicacionDestino] = useState("");
  const [destinoLabel, setDestinoLabel] = useState("");
  const [destinoFijo, setDestinoFijo] = useState(false);
  const [origenZona, setOrigenZona] = useState<OrigenZona>("almacenamiento");
  const [picker, setPicker] = useState<TransferenciaPickerKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const operarioAsignacion = useJefeBodegaOperarioAsignacion({
    open,
    codigoCuenta,
    idBodega,
  });

  const { bloqueadas } = useJefeBodegaUbicacionesBloqueadas({
    open,
    codigoCuenta,
    idBodega,
    tipoFlujos: ["bodega_a_bodega"],
  });

  const resetForm = useCallback(() => {
    setIdUbicacionOrigen("");
    setOrigenLabel("");
    setOrigenMeta(null);
    setIdUbicacionDestino("");
    setDestinoLabel("");
    setDestinoFijo(false);
    setOrigenZona("almacenamiento");
    setError(null);
    setPicker(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const {
    warehouseStock,
    ordenes,
    enriquecimientoProc,
    productoBySolicitud,
    loadingStock,
  } = useJefeBodegaTransferenciaData({ open, idBodega, codigoCuenta });

  const {
    almacenIds,
    codigoByUbicacion,
    origenAlmacenOptions,
    origenProcesamientoOptions,
    destinoOptions,
  } = useJefeBodegaTransferenciaOptions({
    ubicacionesAlmacen,
    ubicacionesProcesamiento,
    bloqueadas,
    warehouseStock,
    enriquecimientoProc,
    origenMeta,
  });

  const origenOptions =
    origenZona === "almacenamiento"
      ? origenAlmacenOptions
      : origenProcesamientoOptions;

  const canSubmit = Boolean(
    codigoCuenta &&
      idBodega &&
      idUbicacionOrigen &&
      idUbicacionDestino &&
      idUbicacionOrigen !== idUbicacionDestino &&
      operarioAsignacion.canAssign,
  );

  const handleSelectOrigen = (option: JefeBodegaSlotPickerOption) => {
    const { idUbicacion, destinoFijoId, origenMeta: nextOrigenMeta } =
      resolveOrigenSeleccion({
        option,
        enriquecimientoProc,
        productoBySolicitud,
        ordenes,
        almacenIds,
        warehouseStock,
      });

    setIdUbicacionOrigen(idUbicacion);
    setOrigenLabel(option.title);
    setOrigenMeta(nextOrigenMeta);

    if (destinoFijoId) {
      setIdUbicacionDestino(destinoFijoId);
      setDestinoLabel(
        codigoByUbicacion.get(destinoFijoId) ?? "Misma caja primario",
      );
      setDestinoFijo(true);
    } else {
      setDestinoFijo(false);
      if (idUbicacionDestino === idUbicacion) {
        setIdUbicacionDestino("");
        setDestinoLabel("");
      }
    }

    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !codigoCuenta || !idBodega || !origenMeta) {
      setError(
        operarioAsignacion.blockReason ??
          "Selecciona origen y destino para crear la transferencia.",
      );
      return;
    }

    if (origenMeta.rol === "sobrante" && !destinoFijo) {
      setError(
        "No se encontró la caja de almacenamiento del primario para devolver el sobrante.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const observaciones = buildTransferenciaObservaciones(origenMeta);

      await createJefeOrdenTrabajo({
        codigoCuenta,
        idBodega,
        tipoFlujo: "bodega_a_bodega",
        idUbicacionOrigen: origenMeta.idUbicacion,
        idUbicacionDestino,
        idAsignado: operarioAsignacion.idAsignado ?? undefined,
        idProducto: origenMeta.idProducto ?? undefined,
        cantidad: origenMeta.cantidad ?? undefined,
        observaciones,
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

  const sinOrigenes = !loadingStock && origenOptions.length === 0;
  const sinDestinos = ubicacionesAlmacen.length === 0;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        title="Transferir cajas"
        description="Desde almacenamiento o procesamiento hacia almacenamiento"
        onSubmit={handleSubmit}
        submitLabel="Crear orden"
        submitDisabled={!canSubmit || isSubmitting}
        hideHeaderClose
        size="md"
      >
        <JefeBodegaModalSection icon={MapPin} label="Origen">
          {sinOrigenes ? (
            <JefeBodegaModalNotice>
              No hay cajas en la zona seleccionada. Abrí la lupa y cambiá a
              almacenamiento o procesamiento.
            </JefeBodegaModalNotice>
          ) : null}
          <JefeBodegaModalSearchField
            id="jefe-transferencia-origen"
            value={origenLabel}
            placeholder="Seleccionar casillero origen"
            ariaLabel="Casillero origen"
            onSearchClick={() => setPicker("origen")}
          />
          <JefeBodegaModalHint>
            Al abrir la lupa podés elegir zona almacenamiento o procesamiento.
          </JefeBodegaModalHint>
        </JefeBodegaModalSection>

        <JefeBodegaModalSection icon={LayoutGrid} label="Destino">
          {sinDestinos ? (
            <JefeBodegaModalNotice>
              No hay casilleros de almacenamiento configurados en esta bodega.
            </JefeBodegaModalNotice>
          ) : destinoFijo ? (
            <>
              <div className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 polaria-text-body-sm font-semibold text-polaria-w">
                {destinoLabel}
              </div>
              <JefeBodegaModalHint>
                Sobrante: se reintegra a la misma caja del primario (no crea otra).
              </JefeBodegaModalHint>
            </>
          ) : (
            <>
              <JefeBodegaModalSearchField
                id="jefe-transferencia-destino"
                value={destinoLabel}
                placeholder="Seleccionar casillero destino"
                ariaLabel="Casillero destino"
                onSearchClick={() => setPicker("destino")}
              />
              <JefeBodegaModalHint>
                El operario moverá la caja al casillero que elijas.
              </JefeBodegaModalHint>
            </>
          )}
        </JefeBodegaModalSection>

        <JefeBodegaOperarioPicker asignacion={operarioAsignacion} />

        {error ? (
          <p role="alert" className="polaria-text-body-sm text-polaria-danger">
            {error}
          </p>
        ) : null}
      </PolariaFormModal>

      <JefeBodegaSlotPickerModal
        open={picker === "origen"}
        onClose={() => setPicker(null)}
        title="Seleccionar origen"
        description={
          origenZona === "almacenamiento"
            ? "Casilleros de almacenamiento con stock."
            : "Cajas en procesamiento (sobrante / resultado)."
        }
        options={origenOptions}
        selectedId={
          origenMeta
            ? origenMeta.zona === "almacenamiento"
              ? `alm:${origenMeta.idUbicacion}`
              : `proc:${origenMeta.idUbicacion}:${origenMeta.rol}`
            : null
        }
        emptyMessage={
          origenZona === "almacenamiento"
            ? "No hay casilleros con producto en almacenamiento."
            : "No hay cajas disponibles en procesamiento."
        }
        toolbar={
          <JefeBodegaTransferenciaOrigenToolbar
            origenZona={origenZona}
            onChange={setOrigenZona}
          />
        }
        onSelect={handleSelectOrigen}
      />

      <JefeBodegaSlotPickerModal
        open={picker === "destino" && !destinoFijo}
        onClose={() => setPicker(null)}
        title="Seleccionar destino"
        description="Slots de almacenamiento en bodega."
        options={destinoOptions}
        selectedId={idUbicacionDestino || null}
        emptyMessage="No hay casilleros de almacenamiento."
        onSelect={(option) => {
          if (option.disabled) return;
          setIdUbicacionDestino(option.id);
          setDestinoLabel(option.title);
          setError(null);
        }}
      />
    </>
  );
}
