"use client";

import { LayoutGrid, MapPin } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import {
  formatCantidadSlot,
  formatTemperaturaSlot,
  resolveOrdenCompraCodigo,
  resolveProductoNombre,
} from "@/modules/warehouses/estado-bodega/utils/estado-bodega-slot-content";
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

interface Props {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  idBodega: string | null;
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[];
  onCreated?: () => void;
}

type PickerKind = "origen" | "destino" | null;

export function JefeBodegaTransferenciaModal({
  open,
  onClose,
  codigoCuenta,
  idBodega,
  ubicacionesAlmacen,
  onCreated,
}: Props) {
  const [idUbicacionOrigen, setIdUbicacionOrigen] = useState("");
  const [origenLabel, setOrigenLabel] = useState("");
  const [idUbicacionDestino, setIdUbicacionDestino] = useState("");
  const [destinoLabel, setDestinoLabel] = useState("");
  const [almacenStock, setAlmacenStock] = useState<WarehouseStateRow[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [picker, setPicker] = useState<PickerKind>(null);
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
    setIdUbicacionDestino("");
    setDestinoLabel("");
    setError(null);
    setPicker(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadStock() {
      if (!idBodega || !codigoCuenta) {
        if (!cancelled) setAlmacenStock([]);
        return;
      }

      setLoadingStock(true);
      try {
        const rows = await listWarehouseState({
          idBodega,
          codigoCuenta,
          limit: 500,
        });
        if (!cancelled) setAlmacenStock(rows);
      } catch {
        if (!cancelled) setAlmacenStock([]);
      } finally {
        if (!cancelled) setLoadingStock(false);
      }
    }

    void loadStock();
    return () => {
      cancelled = true;
    };
  }, [open, idBodega, codigoCuenta]);

  const almacenIds = useMemo(
    () => new Set(ubicacionesAlmacen.map((u) => u.id_ubicacion)),
    [ubicacionesAlmacen],
  );

  const ubicacionesDisponibles = useMemo(
    () =>
      ubicacionesAlmacen.filter(
        (ubicacion) => !bloqueadas.has(ubicacion.id_ubicacion),
      ),
    [ubicacionesAlmacen, bloqueadas],
  );

  const ubicacionesDisponiblesIds = useMemo(
    () => new Set(ubicacionesDisponibles.map((u) => u.id_ubicacion)),
    [ubicacionesDisponibles],
  );

  const codigoByUbicacion = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of ubicacionesAlmacen) {
      map.set(u.id_ubicacion, u.codigo);
    }
    return map;
  }, [ubicacionesAlmacen]);

  const almacenSorted = useMemo(
    () =>
      [...ubicacionesAlmacen].sort((a, b) =>
        a.codigo.localeCompare(b.codigo, "es"),
      ),
    [ubicacionesAlmacen],
  );

  const slotNumberById = useMemo(
    () =>
      new Map(
        almacenSorted.map((ubicacion, index) => [
          ubicacion.id_ubicacion,
          index + 1,
        ]),
      ),
    [almacenSorted],
  );

  const origenOptions = useMemo<JefeBodegaSlotPickerOption[]>(() => {
    const seenUbicaciones = new Set<string>();
    const options: JefeBodegaSlotPickerOption[] = [];

    for (const row of almacenStock) {
      if (!almacenIds.has(row.id_ubicacion)) continue;
      if (!ubicacionesDisponiblesIds.has(row.id_ubicacion)) continue;
      if (Number.parseFloat(row.cantidad || "0") <= 0) continue;
      if (seenUbicaciones.has(row.id_ubicacion)) continue;

      seenUbicaciones.add(row.id_ubicacion);

      const codigoSlot = codigoByUbicacion.get(row.id_ubicacion) ?? "Slot";
      const nombre = resolveProductoNombre(row) ?? "Producto";
      const orden = resolveOrdenCompraCodigo(row);
      const temp = formatTemperaturaSlot(row.temperatura);
      const cantidad = formatCantidadSlot(row.cantidad);

      options.push({
        id: row.id_ubicacion,
        title: `${codigoSlot} — ${nombre}`,
        subtitle: orden ?? null,
        meta: temp,
        slotNumber: slotNumberById.get(row.id_ubicacion) ?? 1,
        codigo: codigoSlot,
        visual: "ocupada_primario",
        detalle: {
          productoNombre: nombre,
          idPaquete: orden,
          cliente: null,
          cantidad,
          posicion: codigoSlot,
          temperatura: temp,
          ordenCompraCodigo: orden,
        },
      });
    }

    return options;
  }, [
    almacenStock,
    almacenIds,
    ubicacionesDisponiblesIds,
    codigoByUbicacion,
    slotNumberById,
  ]);

  const destinoOptions = useMemo<JefeBodegaSlotPickerOption[]>(
    () =>
      ubicacionesAlmacen.map((ubicacion, index) => {
        const libre = (ubicacion.estado_slot?.toLowerCase() ?? "libre") === "libre";
        const isOrigen = ubicacion.id_ubicacion === idUbicacionOrigen;

        return {
          id: ubicacion.id_ubicacion,
          title: ubicacion.codigo,
          subtitle: isOrigen
            ? "Casillero de origen"
            : libre
              ? "Casillero libre"
              : `Estado: ${ubicacion.estado_slot}`,
          slotNumber: index + 1,
          codigo: ubicacion.codigo,
          disabled: isOrigen,
          visual: libre ? "vacia" : "ocupada_primario",
          detalle: libre
            ? null
            : {
                productoNombre: ubicacion.codigo,
                idPaquete: null,
                cliente: null,
                cantidad: "—",
                posicion: ubicacion.codigo,
                temperatura: null,
                ordenCompraCodigo: null,
              },
        };
      }),
    [ubicacionesAlmacen, idUbicacionOrigen],
  );

  const canSubmit = Boolean(
    codigoCuenta &&
      idBodega &&
      idUbicacionOrigen &&
      idUbicacionDestino &&
      idUbicacionOrigen !== idUbicacionDestino &&
      operarioAsignacion.canAssign,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !codigoCuenta || !idBodega) {
      setError(
        operarioAsignacion.blockReason ??
          "Selecciona origen y destino para crear la transferencia.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createJefeOrdenTrabajo({
        codigoCuenta,
        idBodega,
        tipoFlujo: "bodega_a_bodega",
        idUbicacionOrigen,
        idUbicacionDestino,
        idAsignado: operarioAsignacion.idAsignado ?? undefined,
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
        description="Bodega a bodega dentro del almacenamiento"
        onSubmit={handleSubmit}
        submitLabel="Crear orden"
        submitDisabled={!canSubmit || isSubmitting}
        hideHeaderClose
        size="md"
      >
        <JefeBodegaModalSection icon={MapPin} label="Origen">
          {sinOrigenes ? (
            <JefeBodegaModalNotice>
              No hay cajas en almacenamiento disponibles para transferir. Solo
              aparecen casilleros con stock y sin tarea pendiente.
            </JefeBodegaModalNotice>
          ) : (
            <JefeBodegaModalSearchField
              id="jefe-transferencia-origen"
              value={origenLabel}
              placeholder="Seleccionar casillero origen"
              ariaLabel="Casillero origen"
              onSearchClick={() => setPicker("origen")}
            />
          )}
          <JefeBodegaModalHint>
            Casilleros de almacenamiento con producto asignado.
          </JefeBodegaModalHint>
        </JefeBodegaModalSection>

        <JefeBodegaModalSection icon={LayoutGrid} label="Destino">
          {sinDestinos ? (
            <JefeBodegaModalNotice>
              No hay casilleros de almacenamiento configurados en esta bodega.
            </JefeBodegaModalNotice>
          ) : (
            <JefeBodegaModalSearchField
              id="jefe-transferencia-destino"
              value={destinoLabel}
              placeholder="Seleccionar casillero destino"
              ariaLabel="Casillero destino"
              onSearchClick={() => setPicker("destino")}
            />
          )}
          <JefeBodegaModalHint>
            El operario moverá la caja al casillero que elijas.
          </JefeBodegaModalHint>
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
        description="Casilleros de almacenamiento con stock."
        options={origenOptions}
        selectedId={idUbicacionOrigen || null}
        emptyMessage="No hay casilleros con producto en almacenamiento."
        onSelect={(option) => {
          setIdUbicacionOrigen(option.id);
          setOrigenLabel(option.title);
          if (idUbicacionDestino === option.id) {
            setIdUbicacionDestino("");
            setDestinoLabel("");
          }
          setError(null);
        }}
      />

      <JefeBodegaSlotPickerModal
        open={picker === "destino"}
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
