"use client";

import { LayoutGrid } from "lucide-react";
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

export function JefeBodegaRevisarModal({
  open,
  onClose,
  codigoCuenta,
  idBodega,
  ubicacionesAlmacen,
  onCreated,
}: Props) {
  const [idUbicacionDestino, setIdUbicacionDestino] = useState("");
  const [posicionLabel, setPosicionLabel] = useState("");
  const [almacenStock, setAlmacenStock] = useState<WarehouseStateRow[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
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
    tipoFlujos: ["revisar"],
  });

  const resetForm = useCallback(() => {
    setIdUbicacionDestino("");
    setPosicionLabel("");
    setError(null);
    setPickerOpen(false);
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

  const ubicacionesDisponibles = useMemo(
    () =>
      ubicacionesAlmacen.filter(
        (ubicacion) => !bloqueadas.has(ubicacion.id_ubicacion),
      ),
    [ubicacionesAlmacen, bloqueadas],
  );

  const stockByUbicacion = useMemo(() => {
    const map = new Map<string, WarehouseStateRow[]>();

    for (const row of almacenStock) {
      const cantidad = Number.parseFloat(row.cantidad || "0");
      if (!Number.isFinite(cantidad) || cantidad <= 0) continue;

      const current = map.get(row.id_ubicacion) ?? [];
      current.push(row);
      map.set(row.id_ubicacion, current);
    }

    return map;
  }, [almacenStock]);

  const posicionOptions = useMemo<JefeBodegaSlotPickerOption[]>(() => {
    const sorted = [...ubicacionesDisponibles].sort((a, b) =>
      a.codigo.localeCompare(b.codigo, "es"),
    );

    return sorted.map((ubicacion, index) => {
      const stockRows = stockByUbicacion.get(ubicacion.id_ubicacion) ?? [];
      const primary = stockRows[0];
      const hasStock = stockRows.length > 0;

      if (!hasStock || !primary) {
        return {
          id: ubicacion.id_ubicacion,
          title: ubicacion.codigo,
          subtitle: "Casillero libre",
          slotNumber: index + 1,
          codigo: ubicacion.codigo,
          visual: "vacia" as const,
          detalle: null,
        };
      }

      const nombre = resolveProductoNombre(primary) ?? "Producto";
      const orden = resolveOrdenCompraCodigo(primary);
      const temp = formatTemperaturaSlot(primary.temperatura);
      const cantidad = formatCantidadSlot(
        stockRows.reduce((sum, row) => {
          const value = Number.parseFloat(row.cantidad || "0");
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0),
      );

      return {
        id: ubicacion.id_ubicacion,
        title: `${ubicacion.codigo} — ${nombre}`,
        subtitle: orden ?? "Con stock",
        meta: temp,
        slotNumber: index + 1,
        codigo: ubicacion.codigo,
        visual: "ocupada_primario" as const,
        detalle: {
          productoNombre: nombre,
          idPaquete: orden,
          cliente: null,
          cantidad,
          posicion: ubicacion.codigo,
          temperatura: temp,
          ordenCompraCodigo: orden,
          lockedBy: null,
        },
      };
    });
  }, [ubicacionesDisponibles, stockByUbicacion]);

  const canSubmit = Boolean(
    codigoCuenta &&
      idBodega &&
      idUbicacionDestino &&
      operarioAsignacion.canAssign,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !codigoCuenta || !idBodega) {
      setError(
        operarioAsignacion.blockReason ??
          "Selecciona la posición a revisar.",
      );
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

  const sinPosiciones = !loadingStock && posicionOptions.length === 0;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        title="Revisar posición"
        description="Orden de conteo / revisión de casillero"
        onSubmit={handleSubmit}
        submitLabel="Crear revisión"
        submitDisabled={!canSubmit || isSubmitting}
        hideHeaderClose
        size="md"
      >
        <JefeBodegaModalSection icon={LayoutGrid} label="Posición">
          {sinPosiciones ? (
            <JefeBodegaModalNotice>
              No hay casilleros disponibles para revisar. Puede haber tareas de
              revisión pendientes en esas posiciones.
            </JefeBodegaModalNotice>
          ) : (
            <JefeBodegaModalSearchField
              id="jefe-revisar-posicion"
              value={posicionLabel}
              placeholder="Seleccionar casillero"
              ariaLabel="Posición a revisar"
              onSearchClick={() => setPickerOpen(true)}
            />
          )}
          <JefeBodegaModalHint>
            El operario marcará la revisión como completada.
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
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Seleccionar posición"
        description="Casilleros de almacenamiento disponibles para revisión."
        options={posicionOptions}
        selectedId={idUbicacionDestino || null}
        emptyMessage="No hay casilleros disponibles para revisar."
        onSelect={(option) => {
          setIdUbicacionDestino(option.id);
          setPosicionLabel(option.title);
          setError(null);
        }}
      />
    </>
  );
}
