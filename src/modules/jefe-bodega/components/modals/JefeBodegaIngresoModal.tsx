"use client";

import { LayoutGrid, MapPin, Package } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
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

interface JefeBodegaIngresoModalProps {
  open: boolean;
  onClose: () => void;
  codigoCuenta?: string | null;
  idBodega?: string | null;
  ubicacionesAlmacen?: UbicacionEstadoBodegaDbRow[];
  ubicacionesIngreso?: UbicacionEstadoBodegaDbRow[];
  onCreated?: () => void;
}

type PickerKind = "destino" | "producto" | null;

export function JefeBodegaIngresoModal({
  open,
  onClose,
  codigoCuenta = null,
  idBodega = null,
  ubicacionesAlmacen = [],
  ubicacionesIngreso = [],
  onCreated,
}: JefeBodegaIngresoModalProps) {
  const [idUbicacionDestino, setIdUbicacionDestino] = useState("");
  const [destinoLabel, setDestinoLabel] = useState("");
  const [productoRow, setProductoRow] = useState<WarehouseStateRow | null>(null);
  const [productoLabel, setProductoLabel] = useState("");
  const [ingresoStock, setIngresoStock] = useState<WarehouseStateRow[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const operarioAsignacion = useJefeBodegaOperarioAsignacion({
    open,
    codigoCuenta,
    idBodega,
  });

  const { bloqueadas: ubicacionesBloqueadas } = useJefeBodegaUbicacionesBloqueadas({
    open,
    codigoCuenta,
    idBodega,
    tipoFlujos: ["a_bodega"],
  });

  const resetForm = useCallback(() => {
    setIdUbicacionDestino("");
    setDestinoLabel("");
    setProductoRow(null);
    setProductoLabel("");
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
        if (!cancelled) setIngresoStock([]);
        return;
      }

      setLoadingStock(true);
      try {
        const rows = await listWarehouseState({
          idBodega,
          codigoCuenta,
          limit: 500,
        });
        if (!cancelled) setIngresoStock(rows);
      } catch {
        if (!cancelled) setIngresoStock([]);
      } finally {
        if (!cancelled) setLoadingStock(false);
      }
    }

    void loadStock();
    return () => {
      cancelled = true;
    };
  }, [open, idBodega, codigoCuenta]);

  const ingresoIds = useMemo(
    () => new Set(ubicacionesIngreso.map((u) => u.id_ubicacion)),
    [ubicacionesIngreso],
  );

  const codigoByUbicacion = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of [...ubicacionesAlmacen, ...ubicacionesIngreso]) {
      map.set(u.id_ubicacion, u.codigo);
    }
    return map;
  }, [ubicacionesAlmacen, ubicacionesIngreso]);

  const destinoOptions = useMemo<JefeBodegaSlotPickerOption[]>(
    () =>
      ubicacionesAlmacen.map((u, index) => {
        const libre = (u.estado_slot?.toLowerCase() ?? "libre") === "libre";
        return {
          id: u.id_ubicacion,
          title: u.codigo,
          subtitle: libre ? "Casillero libre" : `Estado: ${u.estado_slot}`,
          slotNumber: index + 1,
          codigo: u.codigo,
          visual: libre ? "vacia" : "ocupada_primario",
          detalle: libre
            ? null
            : {
                productoNombre: u.codigo,
                idPaquete: null,
                cliente: null,
                cantidad: "—",
                posicion: u.codigo,
                temperatura: null,
                ordenCompraCodigo: null,
                lockedBy: null,
              },
        };
      }),
    [ubicacionesAlmacen],
  );

  const productoOptions = useMemo<JefeBodegaSlotPickerOption[]>(() => {
    const ingresoSorted = [...ubicacionesIngreso].sort((a, b) =>
      a.codigo.localeCompare(b.codigo, "es"),
    );
    const slotNumberById = new Map(
      ingresoSorted.map((u, index) => [u.id_ubicacion, index + 1]),
    );

    return ingresoStock
      .filter((row) => ingresoIds.has(row.id_ubicacion))
      .filter((row) => !ubicacionesBloqueadas.has(row.id_ubicacion))
      .filter((row) => Number.parseFloat(row.cantidad || "0") > 0)
      .map((row) => {
        const codigoSlot =
          codigoByUbicacion.get(row.id_ubicacion) ?? "Ingreso";
        const nombre = resolveProductoNombre(row) ?? "Producto";
        const orden = resolveOrdenCompraCodigo(row);
        const temp = formatTemperaturaSlot(row.temperatura);
        const cantidad = formatCantidadSlot(row.cantidad);
        return {
          id: row.id_warehouse_state,
          title: `${codigoSlot} — ${nombre}`,
          subtitle: orden ?? null,
          meta: temp,
          slotNumber: slotNumberById.get(row.id_ubicacion) ?? 1,
          codigo: codigoSlot,
          visual: "ocupada_primario" as const,
          detalle: {
            productoNombre: nombre,
            idPaquete: orden,
            cliente: null,
            cantidad,
            posicion: codigoSlot,
            temperatura: temp,
            ordenCompraCodigo: orden,
            lockedBy: row.locked_by?.trim() || null,
          },
        };
      });
  }, [ingresoStock, ingresoIds, codigoByUbicacion, ubicacionesIngreso, ubicacionesBloqueadas]);

  const canSubmit = Boolean(
    codigoCuenta &&
      idBodega &&
      idUbicacionDestino &&
      productoRow?.id_ubicacion &&
      productoRow.id_producto &&
      operarioAsignacion.canAssign,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !productoRow || !codigoCuenta || !idBodega) {
      setError(
        operarioAsignacion.blockReason ??
          "Completa destino y producto para crear el ingreso.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const cantidad = Number.parseFloat(productoRow.cantidad || "0");
      await createJefeOrdenTrabajo({
        codigoCuenta,
        idBodega,
        tipoFlujo: "a_bodega",
        idUbicacionOrigen: productoRow.id_ubicacion,
        idUbicacionDestino,
        idProducto: productoRow.id_producto,
        idLote: productoRow.id_lote ?? undefined,
        cantidad: Number.isFinite(cantidad) ? cantidad : undefined,
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

  const sinDestinos = ubicacionesAlmacen.length === 0;
  const sinProductos = !loadingStock && productoOptions.length === 0;

  return (
    <>
      <PolariaFormModal
        open={open}
        onClose={handleClose}
        title="Registrar entrada"
        description="Generar orden de ingreso"
        onSubmit={handleSubmit}
        submitLabel="Crear ingreso"
        submitDisabled={!canSubmit || isSubmitting}
        hideHeaderClose
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

        <JefeBodegaModalSection icon={Package} label="Producto en ingreso">
          {sinProductos ? (
            <JefeBodegaModalNotice>
              No hay cajas en zona de ingreso. Cuando el custodio registre
              mercancía, podrás seleccionar el producto a trasladar.
            </JefeBodegaModalNotice>
          ) : (
            <JefeBodegaModalSearchField
              id="jefe-ingreso-producto"
              value={productoLabel}
              placeholder="Seleccionar producto / caja"
              ariaLabel="Producto en ingreso"
              onSearchClick={() => setPicker("producto")}
            />
          )}
          <JefeBodegaModalHint>
            Solo aparecen cajas que aún están en la zona de ingreso.
          </JefeBodegaModalHint>
        </JefeBodegaModalSection>

        <JefeBodegaModalSection icon={LayoutGrid} label="Posición en bodega">
          {sinDestinos ? (
            <JefeBodegaModalNotice>
              No hay casilleros de almacenamiento disponibles para destino.
            </JefeBodegaModalNotice>
          ) : (
            <JefeBodegaModalSearchField
              id="jefe-ingreso-destino"
              value={destinoLabel}
              placeholder="Seleccionar casillero"
              ariaLabel="Posición en bodega"
              onSearchClick={() => setPicker("destino")}
            />
          )}
          <JefeBodegaModalHint>
            El operario ubicará la caja en el casillero que elijas.
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
        open={picker === "producto"}
        onClose={() => setPicker(null)}
        title="Seleccionar producto"
        description="Solo slots con producto en la zona de ingreso."
        options={productoOptions}
        selectedId={productoRow?.id_warehouse_state ?? null}
        emptyMessage="No hay slots con producto en zona de ingreso."
        onSelect={(option) => {
          const row = ingresoStock.find(
            (item) => item.id_warehouse_state === option.id,
          );
          if (!row) return;
          setProductoRow(row);
          setProductoLabel(option.title);
          setError(null);
        }}
      />

      <JefeBodegaSlotPickerModal
        open={picker === "destino"}
        onClose={() => setPicker(null)}
        title="Seleccionar posición"
        description="Slots de almacenamiento en bodega."
        options={destinoOptions}
        selectedId={idUbicacionDestino || null}
        emptyMessage="No hay casilleros de almacenamiento."
        onSelect={(option) => {
          setIdUbicacionDestino(option.id);
          setDestinoLabel(option.title);
          setError(null);
        }}
      />
    </>
  );
}
