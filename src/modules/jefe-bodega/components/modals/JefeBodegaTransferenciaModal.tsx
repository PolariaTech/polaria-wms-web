"use client";

import { LayoutGrid, MapPin } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import { listOrdenesTrabajoApi } from "@/modules/operations";
import type { OrdenTrabajoApiRow } from "@/modules/operations";
import {
  listSolicitudesProcesamiento,
  listSolicitudesProcesamientoOperador,
} from "@/modules/processing";
import { buildRolDevolucionObservacion } from "@/modules/processing/shared/constants/procesamiento-post-cierre";
import { buildProcesamientoSolicitudRef } from "@/modules/processing/shared/constants/procesamiento-solicitud-ref";
import { formatKilos } from "@/modules/processing/shared/constants/processing-status";
import type {
  ProcesamientoSlotEnriquecimiento,
} from "@/modules/warehouses/estado-bodega/utils/estado-bodega-procesamiento-slot";
import { buildProcesamientoEnriquecimientoByUbicacion } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-procesamiento-slot";
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
import { resolveUbicacionOrigenPrimarioDesdeOt } from "../../utils/transferencia-origen-primario";
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
  ubicacionesProcesamiento: UbicacionEstadoBodegaDbRow[];
  onCreated?: () => void;
}

type PickerKind = "origen" | "destino" | null;
type OrigenZona = "almacenamiento" | "procesamiento";
type OrigenRol = "normal" | "sobrante" | "procesado" | "en_proceso" | "stock";

interface OrigenMeta {
  idUbicacion: string;
  zona: OrigenZona;
  rol: OrigenRol;
  idSolicitud: string | null;
  idProducto: string | null;
  cantidad: number | null;
}

export function JefeBodegaTransferenciaModal({
  open,
  onClose,
  codigoCuenta,
  idBodega,
  ubicacionesAlmacen,
  ubicacionesProcesamiento,
  onCreated,
}: Props) {
  const [idUbicacionOrigen, setIdUbicacionOrigen] = useState("");
  const [origenLabel, setOrigenLabel] = useState("");
  const [origenMeta, setOrigenMeta] = useState<OrigenMeta | null>(null);
  const [idUbicacionDestino, setIdUbicacionDestino] = useState("");
  const [destinoLabel, setDestinoLabel] = useState("");
  const [destinoFijo, setDestinoFijo] = useState(false);
  const [origenZona, setOrigenZona] = useState<OrigenZona>("almacenamiento");
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStateRow[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenTrabajoApiRow[]>([]);
  const [enriquecimientoProc, setEnriquecimientoProc] = useState(
    () => new Map<string, ProcesamientoSlotEnriquecimiento>(),
  );
  const [productoBySolicitud, setProductoBySolicitud] = useState(
    () =>
      new Map<string, { idPrimario: string; idSecundario: string }>(),
  );
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

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadData() {
      if (!idBodega || !codigoCuenta) {
        if (!cancelled) {
          setWarehouseStock([]);
          setOrdenes([]);
          setEnriquecimientoProc(new Map());
          setProductoBySolicitud(new Map());
        }
        return;
      }

      setLoadingStock(true);
      try {
        const [rows, ots, solicitudesOperador, solicitudesDb] =
          await Promise.all([
            listWarehouseState({ idBodega, codigoCuenta, limit: 500 }),
            listOrdenesTrabajoApi({ codigoCuenta, idBodega }).catch(() => []),
            listSolicitudesProcesamientoOperador({
              codigoCuenta,
              idBodega,
            }).catch(() => []),
            listSolicitudesProcesamiento({ codigoCuenta, idBodega }).catch(
              () => [],
            ),
          ]);

        if (cancelled) return;

        setWarehouseStock(rows);
        setOrdenes(ots);
        setEnriquecimientoProc(
          buildProcesamientoEnriquecimientoByUbicacion({
            solicitudesOperador,
            solicitudesDb,
            ordenes: ots,
            warehouseRows: rows,
          }),
        );
        setProductoBySolicitud(
          new Map(
            solicitudesDb.map((row) => [
              row.id_solicitud_procesamiento,
              {
                idPrimario: row.id_producto_primario,
                idSecundario: row.id_producto_secundario,
              },
            ]),
          ),
        );
      } catch {
        if (!cancelled) {
          setWarehouseStock([]);
          setOrdenes([]);
          setEnriquecimientoProc(new Map());
          setProductoBySolicitud(new Map());
        }
      } finally {
        if (!cancelled) setLoadingStock(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [open, idBodega, codigoCuenta]);

  const almacenIds = useMemo(
    () => new Set(ubicacionesAlmacen.map((u) => u.id_ubicacion)),
    [ubicacionesAlmacen],
  );

  const procIds = useMemo(
    () => new Set(ubicacionesProcesamiento.map((u) => u.id_ubicacion)),
    [ubicacionesProcesamiento],
  );

  const ubicacionesDisponiblesIds = useMemo(
    () =>
      new Set(
        ubicacionesAlmacen
          .filter((u) => !bloqueadas.has(u.id_ubicacion))
          .map((u) => u.id_ubicacion),
      ),
    [ubicacionesAlmacen, bloqueadas],
  );

  const codigoByUbicacion = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of [...ubicacionesAlmacen, ...ubicacionesProcesamiento]) {
      map.set(u.id_ubicacion, u.codigo);
    }
    return map;
  }, [ubicacionesAlmacen, ubicacionesProcesamiento]);

  const slotNumberById = useMemo(() => {
    const map = new Map<string, number>();
    [...ubicacionesAlmacen]
      .sort((a, b) => a.codigo.localeCompare(b.codigo, "es"))
      .forEach((u, i) => map.set(u.id_ubicacion, i + 1));
    [...ubicacionesProcesamiento]
      .sort((a, b) => a.codigo.localeCompare(b.codigo, "es"))
      .forEach((u, i) => map.set(u.id_ubicacion, i + 1));
    return map;
  }, [ubicacionesAlmacen, ubicacionesProcesamiento]);

  const origenAlmacenOptions = useMemo<JefeBodegaSlotPickerOption[]>(() => {
    const seen = new Set<string>();
    const options: JefeBodegaSlotPickerOption[] = [];

    for (const row of warehouseStock) {
      if (!almacenIds.has(row.id_ubicacion)) continue;
      if (!ubicacionesDisponiblesIds.has(row.id_ubicacion)) continue;
      if (Number.parseFloat(row.cantidad || "0") <= 0) continue;
      if (seen.has(row.id_ubicacion)) continue;
      seen.add(row.id_ubicacion);

      const codigoSlot = codigoByUbicacion.get(row.id_ubicacion) ?? "Slot";
      const nombre = resolveProductoNombre(row) ?? "Producto";
      const orden = resolveOrdenCompraCodigo(row);
      const temp = formatTemperaturaSlot(row.temperatura);

      options.push({
        id: `alm:${row.id_ubicacion}`,
        title: `${codigoSlot} — ${nombre}`,
        subtitle: orden,
        meta: temp,
        slotNumber: slotNumberById.get(row.id_ubicacion) ?? 1,
        codigo: codigoSlot,
        visual: "ocupada_primario",
        detalle: {
          productoNombre: nombre,
          idPaquete: orden,
          cliente: null,
          cantidad: formatCantidadSlot(row.cantidad),
          posicion: codigoSlot,
          temperatura: temp,
          ordenCompraCodigo: orden,
          lockedBy: null,
        },
      });
    }

    return options;
  }, [
    warehouseStock,
    almacenIds,
    ubicacionesDisponiblesIds,
    codigoByUbicacion,
    slotNumberById,
  ]);

  const origenProcesamientoOptions = useMemo<JefeBodegaSlotPickerOption[]>(() => {
    const options: JefeBodegaSlotPickerOption[] = [];
    const covered = new Set<string>();

    for (const [idUbicacion, meta] of enriquecimientoProc) {
      if (!procIds.has(idUbicacion) || bloqueadas.has(idUbicacion)) continue;
      covered.add(idUbicacion);
      const codigoSlot = codigoByUbicacion.get(idUbicacion) ?? "PROC";

      if (meta.estado === "pendiente_cierre" && meta.sobranteKg) {
        options.push({
          id: `proc:${idUbicacion}:sobrante`,
          title: `${codigoSlot} — ${meta.primarioNombre}`,
          subtitle: `${meta.ordenCodigo} · Sobrante`,
          meta: formatKilos(meta.sobranteKg),
          slotNumber: slotNumberById.get(idUbicacion) ?? 1,
          codigo: codigoSlot,
          visual: "ocupada_primario",
          detalle: {
            productoNombre: meta.primarioNombre,
            idPaquete: meta.ordenCodigo,
            cliente: null,
            cantidad: formatKilos(meta.sobranteKg),
            posicion: codigoSlot,
            temperatura: null,
            ordenCompraCodigo: null,
            lockedBy: null,
            rolProcesamiento: "sobrante",
            sobranteKg: meta.sobranteKg,
          },
        });
      }

      if (meta.estado === "pendiente_cierre" || meta.estado === "en_proceso") {
        const units =
          meta.unidadesSecundario != null
            ? `${meta.unidadesSecundario.toLocaleString("es-CL")} ud.`
            : null;
        const isCierre = meta.estado === "pendiente_cierre";

        options.push({
          id: `proc:${idUbicacion}:${isCierre ? "procesado" : "en_proceso"}`,
          title: `${codigoSlot} — ${meta.resultadoNombre}`,
          subtitle: `${meta.ordenCodigo} · ${isCierre ? "Resultado" : "En proceso"}`,
          meta: units,
          slotNumber: slotNumberById.get(idUbicacion) ?? 1,
          codigo: codigoSlot,
          visual: "ocupada_procesado",
          detalle: {
            productoNombre: meta.resultadoNombre,
            idPaquete: meta.ordenCodigo,
            cliente: null,
            cantidad: units ?? "—",
            posicion: codigoSlot,
            temperatura: null,
            ordenCompraCodigo: null,
            lockedBy: null,
            rolProcesamiento: isCierre ? "procesado" : "en_proceso",
          },
        });
      }
    }

    for (const row of warehouseStock) {
      if (!procIds.has(row.id_ubicacion) || covered.has(row.id_ubicacion)) {
        continue;
      }
      if (bloqueadas.has(row.id_ubicacion)) continue;
      if (Number.parseFloat(row.cantidad || "0") <= 0) continue;

      const codigoSlot = codigoByUbicacion.get(row.id_ubicacion) ?? "PROC";
      const nombre = resolveProductoNombre(row) ?? "Producto";
      options.push({
        id: `proc:${row.id_ubicacion}:stock`,
        title: `${codigoSlot} — ${nombre}`,
        subtitle: resolveOrdenCompraCodigo(row),
        meta: formatTemperaturaSlot(row.temperatura),
        slotNumber: slotNumberById.get(row.id_ubicacion) ?? 1,
        codigo: codigoSlot,
        visual: "ocupada_procesado",
        detalle: {
          productoNombre: nombre,
          idPaquete: resolveOrdenCompraCodigo(row),
          cliente: null,
          cantidad: formatCantidadSlot(row.cantidad),
          posicion: codigoSlot,
          temperatura: formatTemperaturaSlot(row.temperatura),
          ordenCompraCodigo: resolveOrdenCompraCodigo(row),
          lockedBy: null,
        },
      });
    }

    return options;
  }, [
    enriquecimientoProc,
    procIds,
    bloqueadas,
    codigoByUbicacion,
    slotNumberById,
    warehouseStock,
  ]);

  const origenOptions =
    origenZona === "almacenamiento"
      ? origenAlmacenOptions
      : origenProcesamientoOptions;

  const destinoOptions = useMemo<JefeBodegaSlotPickerOption[]>(
    () =>
      ubicacionesAlmacen.map((ubicacion, index) => {
        const libre =
          (ubicacion.estado_slot?.toLowerCase() ?? "libre") === "libre";
        const isOrigen =
          ubicacion.id_ubicacion === origenMeta?.idUbicacion &&
          origenMeta.zona === "almacenamiento";

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
                lockedBy: null,
              },
        };
      }),
    [ubicacionesAlmacen, origenMeta],
  );

  const canSubmit = Boolean(
    codigoCuenta &&
      idBodega &&
      idUbicacionOrigen &&
      idUbicacionDestino &&
      idUbicacionOrigen !== idUbicacionDestino &&
      operarioAsignacion.canAssign,
  );

  const handleSelectOrigen = (option: JefeBodegaSlotPickerOption) => {
    const parts = option.id.split(":");
    const zona: OrigenZona =
      parts[0] === "proc" ? "procesamiento" : "almacenamiento";
    const idUbicacion = parts[1] ?? option.id;
    const rol = (parts[2] ?? "normal") as OrigenRol;

    const meta = enriquecimientoProc.get(idUbicacion);
    const products = meta
      ? productoBySolicitud.get(meta.idSolicitud)
      : undefined;

    let destinoFijoId: string | null = null;
    if (zona === "procesamiento" && rol === "sobrante" && meta) {
      destinoFijoId = resolveUbicacionOrigenPrimarioDesdeOt({
        idUbicacionProcesamiento: idUbicacion,
        idSolicitud: meta.idSolicitud,
        idProductoPrimario: products?.idPrimario ?? null,
        ordenes,
        almacenIds,
        warehouseRows: warehouseStock,
      });
    }

    setIdUbicacionOrigen(idUbicacion);
    setOrigenLabel(option.title);
    setOrigenMeta({
      idUbicacion,
      zona,
      rol,
      idSolicitud: meta?.idSolicitud ?? null,
      idProducto:
        rol === "sobrante"
          ? (products?.idPrimario ?? null)
          : rol === "procesado"
            ? (products?.idSecundario ?? null)
            : null,
      cantidad:
        rol === "sobrante"
          ? (meta?.sobranteKg ?? null)
          : rol === "procesado"
            ? (meta?.unidadesSecundario ?? null)
            : null,
    });

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
      const observacionParts: string[] = [];
      if (origenMeta.rol === "sobrante" || origenMeta.rol === "procesado") {
        observacionParts.push(
          buildRolDevolucionObservacion(
            origenMeta.rol === "sobrante" ? "desperdicio" : "procesado",
          ),
        );
      }
      if (origenMeta.idSolicitud) {
        observacionParts.push(
          buildProcesamientoSolicitudRef(origenMeta.idSolicitud),
        );
      }

      await createJefeOrdenTrabajo({
        codigoCuenta,
        idBodega,
        tipoFlujo: "bodega_a_bodega",
        idUbicacionOrigen: origenMeta.idUbicacion,
        idUbicacionDestino,
        idAsignado: operarioAsignacion.idAsignado ?? undefined,
        idProducto: origenMeta.idProducto ?? undefined,
        cantidad: origenMeta.cantidad ?? undefined,
        observaciones:
          observacionParts.length > 0 ? observacionParts.join("|") : undefined,
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
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["almacenamiento", "Almacenamiento"],
                ["procesamiento", "Procesamiento"],
              ] as const
            ).map(([zona, label]) => (
              <button
                key={zona}
                type="button"
                onClick={() => setOrigenZona(zona)}
                className={cn(
                  "rounded-xl border px-3 py-2 polaria-text-body-sm font-semibold transition",
                  origenZona === zona
                    ? "border-polaria-teal bg-polaria-t-08 text-polaria-teal"
                    : "border-polaria-w-08 bg-polaria-w-08 text-polaria-w-50 hover:border-polaria-t-20",
                )}
              >
                {label}
              </button>
            ))}
          </div>
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
