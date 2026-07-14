"use client";

import { Box, MapPin } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import {
  getOrdenVentaDetalle,
  listOrdenesVentaParaSalida,
} from "@/modules/sales";
import type { OrdenVentaDetalleRow, OrdenVentaOperadorRow } from "@/modules/sales";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import type { JefeBodegaSalidaOrdenVentaPrefill } from "../../types/jefe-bodega-salida.types";
import { createJefeOrdenTrabajo } from "../../services/jefe-bodega-orden.service";
import { resolveSalidaOrigenUbicacion } from "../../services/resolve-salida-origen-ubicacion.service";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
import { resolveSalidaProductoDesdeOrden } from "../../utils/salida-orden-venta";
import { useJefeBodegaOperarioAsignacion } from "../../hooks/useJefeBodegaOperarioAsignacion";
import {
  JefeBodegaModalHint,
  JefeBodegaModalNotice,
  JefeBodegaModalSearchField,
  JefeBodegaModalSection,
} from "./jefe-bodega-modal-ui";
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

function formatOrdenVentaLabel(orden: OrdenVentaOperadorRow): string {
  return `${orden.venta} — ${orden.comprador}`;
}

function resolveOrdenFromList(
  rows: OrdenVentaOperadorRow[],
  prefill: JefeBodegaSalidaOrdenVentaPrefill,
): OrdenVentaOperadorRow | undefined {
  if (prefill.idOrdenVenta?.trim()) {
    const byId = rows.find(
      (row) => row.idOrdenVenta === prefill.idOrdenVenta?.trim(),
    );
    if (byId) return byId;
  }

  const codigo = prefill.ovCodigo?.trim().toUpperCase();
  if (!codigo) return undefined;

  return rows.find((row) => row.venta.toUpperCase() === codigo);
}

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
  const [idOrdenVenta, setIdOrdenVenta] = useState("");
  const [origenLabel, setOrigenLabel] = useState("");
  const [idUbicacionOrigen, setIdUbicacionOrigen] = useState("");
  const [ordenDetalle, setOrdenDetalle] = useState<OrdenVentaDetalleRow | null>(
    null,
  );
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [idUbicacionDestino, setIdUbicacionDestino] = useState("");
  const [destinoLabel, setDestinoLabel] = useState("");
  const [ordenesConfirmadas, setOrdenesConfirmadas] = useState<
    OrdenVentaOperadorRow[]
  >([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const operarioAsignacion = useJefeBodegaOperarioAsignacion({
    open,
    codigoCuenta,
    idBodega,
  });

  const almacenUbicacionIds = useMemo(
    () => new Set(ubicacionesAlmacen.map((u) => u.id_ubicacion)),
    [ubicacionesAlmacen],
  );

  const codigoByUbicacion = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of ubicacionesAlmacen) {
      map.set(u.id_ubicacion, u.codigo);
    }
    return map;
  }, [ubicacionesAlmacen]);

  const resetForm = useCallback(() => {
    setIdOrdenVenta("");
    setOrigenLabel("");
    setIdUbicacionOrigen("");
    setOrdenDetalle(null);
    setIdUbicacionDestino("");
    setDestinoLabel("");
    setError(null);
    setPicker(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const resolveOrigenUbicacion = useCallback(
    async (
      targetIdOrdenVenta: string,
      ovCodigo: string | null | undefined,
      detalle: OrdenVentaDetalleRow | null,
      prefillUbicacionOrigen?: string | null,
    ) => {
      if (!codigoCuenta || !idBodega) {
        setIdUbicacionOrigen("");
        return null;
      }

      const resolved = await resolveSalidaOrigenUbicacion({
        codigoCuenta,
        idBodega,
        idOrdenVenta: targetIdOrdenVenta,
        ovCodigo,
        ordenDetalle: detalle,
        almacenUbicacionIds,
        prefillUbicacionOrigen,
      });

      setIdUbicacionOrigen(resolved ?? "");
      return resolved;
    },
    [almacenUbicacionIds, codigoCuenta, idBodega],
  );

  const loadOrdenDetalle = useCallback(
    async (targetIdOrdenVenta: string) => {
      if (!codigoCuenta || !targetIdOrdenVenta.trim()) {
        setOrdenDetalle(null);
        return null;
      }

      setLoadingDetalle(true);
      try {
        const detalle = await getOrdenVentaDetalle({
          codigoCuenta,
          idOrdenVenta: targetIdOrdenVenta.trim(),
        });
        setOrdenDetalle(detalle);
        return detalle;
      } catch {
        setOrdenDetalle(null);
        return null;
      } finally {
        setLoadingDetalle(false);
      }
    },
    [codigoCuenta],
  );

  const applyOrdenSeleccionada = useCallback(
    async (
      orden: OrdenVentaOperadorRow,
      prefillUbicacionOrigen?: string | null,
    ) => {
      setIdOrdenVenta(orden.idOrdenVenta);
      setOrigenLabel(formatOrdenVentaLabel(orden));
      setError(null);

      const detalle = await loadOrdenDetalle(orden.idOrdenVenta);
      const resolved = await resolveOrigenUbicacion(
        orden.idOrdenVenta,
        orden.venta,
        detalle,
        prefillUbicacionOrigen,
      );

      if (!resolved) {
        setError(
          "No se pudo determinar el casillero de almacenamiento con stock reservado para esta venta.",
        );
      }
    },
    [loadOrdenDetalle, resolveOrigenUbicacion],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadOrdenes() {
      if (!codigoCuenta) {
        if (!cancelled) setOrdenesConfirmadas([]);
        return;
      }

      setLoadingOrdenes(true);
      try {
        const rows = await listOrdenesVentaParaSalida({
          codigoCuenta,
          idBodega: idBodega ?? undefined,
        });
        if (!cancelled) {
          setOrdenesConfirmadas(rows);
        }
      } catch {
        if (!cancelled) setOrdenesConfirmadas([]);
      } finally {
        if (!cancelled) setLoadingOrdenes(false);
      }
    }

    void loadOrdenes();
    return () => {
      cancelled = true;
    };
  }, [open, codigoCuenta, idBodega]);

  useEffect(() => {
    if (!open || !prefillOrdenVenta) return;
    if (loadingOrdenes) return;

    const orden = resolveOrdenFromList(ordenesConfirmadas, prefillOrdenVenta);
    if (orden) {
      void applyOrdenSeleccionada(
        orden,
        prefillOrdenVenta.idUbicacionOrigen,
      );
      return;
    }

    const idFromPrefill = prefillOrdenVenta.idOrdenVenta?.trim();
    if (idFromPrefill) {
      setIdOrdenVenta(idFromPrefill);
      setOrigenLabel(
        prefillOrdenVenta.ovCodigo?.trim() ||
          prefillOrdenVenta.idOrdenVenta?.trim() ||
          "",
      );
      void (async () => {
        const detalle = await loadOrdenDetalle(idFromPrefill);
        const resolved = await resolveOrigenUbicacion(
          idFromPrefill,
          prefillOrdenVenta.ovCodigo,
          detalle,
          prefillOrdenVenta.idUbicacionOrigen,
        );
        if (!resolved) {
          setError(
            "No se pudo determinar el casillero de almacenamiento con stock reservado para esta venta.",
          );
        }
      })();
    }
  }, [
    open,
    prefillOrdenVenta,
    loadingOrdenes,
    ordenesConfirmadas,
    applyOrdenSeleccionada,
    loadOrdenDetalle,
    resolveOrigenUbicacion,
  ]);

  const destinoOptions = useMemo<JefeBodegaSlotPickerOption[]>(() => {
    return [...ubicacionesPicking]
      .sort((a, b) => a.codigo.localeCompare(b.codigo, "es"))
      .map((ubicacion, index) => {
        const libre =
          (ubicacion.estado_slot?.toLowerCase() ?? "libre") === "libre";

        return {
          id: ubicacion.id_ubicacion,
          title: ubicacion.codigo,
          subtitle: libre ? "Zona salida · libre" : `Estado: ${ubicacion.estado_slot}`,
          slotNumber: index + 1,
          codigo: ubicacion.codigo,
          visual: libre ? ("vacia" as const) : ("ocupada_primario" as const),
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
                lockedBy: null,
              },
        };
      });
  }, [ubicacionesPicking]);

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
