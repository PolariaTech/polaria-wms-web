import {
  solicitudTieneSobrantePendiente,
} from "@/modules/processing/shared/constants/procesamiento-post-cierre";
import {
  parseProcesamientoSolicitudRef,
} from "@/modules/processing/shared/constants/procesamiento-solicitud-ref";
import {
  formatKilos,
  formatUnidades,
} from "@/modules/processing/shared/constants/processing-status";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type {
  EstadoBodegaSectionView,
  EstadoBodegaSlot,
  EstadoBodegaSlotDetalleView,
} from "../types/estado-bodega.types";
import {
  type ProcesamientoSlotEnriquecimiento,
  type ProcesamientoZonaParams,
  isSolicitudActivaEnProcesamiento,
  padProcesamientoSlots,
  parsePositiveNumber,
  resolveSobranteKgPendienteEnMapa,
  resultadoYaUbicadoEnOrdenes,
} from "./estado-bodega-procesamiento-slot.shared";

export function buildProcesamientoEnriquecimientoByUbicacion(
  params: ProcesamientoZonaParams,
): Map<string, ProcesamientoSlotEnriquecimiento> {
  const { solicitudesOperador, solicitudesDb, ordenes, warehouseRows } = params;

  const operadorById = new Map(
    solicitudesOperador
      .filter((s) => isSolicitudActivaEnProcesamiento(s.estado))
      .map((s) => [s.idSolicitudProcesamiento, s]),
  );

  const dbById = new Map(
    solicitudesDb
      .filter((s) => isSolicitudActivaEnProcesamiento(s.estado))
      .map((s) => [s.id_solicitud_procesamiento, s]),
  );

  const enriquecimientoByUbicacion = new Map<
    string,
    ProcesamientoSlotEnriquecimiento
  >();

  const setEnriquecimiento = (idUbicacion: string, idSolicitud: string) => {
    const operador = operadorById.get(idSolicitud);
    const db = dbById.get(idSolicitud);
    if (!operador || !db) return;

    const sobranteRaw = parsePositiveNumber(db.sobrante_kg);
    const idProductoPrimario = db.id_producto_primario?.trim() ?? "";

    enriquecimientoByUbicacion.set(idUbicacion, {
      idSolicitud,
      estado: operador.estado,
      ordenCodigo: operador.orden,
      primarioNombre: operador.primario,
      resultadoNombre: operador.secundario,
      sobranteKg: idProductoPrimario
        ? resolveSobranteKgPendienteEnMapa({
            sobranteRaw,
            idSolicitud,
            idUbicacion,
            idProductoPrimario,
            warehouseRows,
            ordenes,
          })
        : solicitudTieneSobrantePendiente(sobranteRaw)
          ? sobranteRaw
          : null,
      resultadoPendiente: !resultadoYaUbicadoEnOrdenes(ordenes, idSolicitud),
      unidadesSecundario:
        parsePositiveNumber(db.kilos_secundario) ??
        parsePositiveNumber(operador.estimSecundario),
    });
  };

  for (const orden of ordenes) {
    if (orden.tipoFlujo !== "a_procesamiento") continue;

    const idUbicacion = orden.idUbicacionDestino?.trim();
    if (!idUbicacion) continue;

    const idSolicitud = parseProcesamientoSolicitudRef(orden.observaciones);
    if (!idSolicitud) continue;

    if (operadorById.has(idSolicitud)) {
      setEnriquecimiento(idUbicacion, idSolicitud);
    }
  }

  const stockByUbicacion = new Map<string, WarehouseStateRow[]>();
  for (const row of warehouseRows) {
    const cantidad = Number.parseFloat(row.cantidad || "0");
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue;

    const current = stockByUbicacion.get(row.id_ubicacion) ?? [];
    current.push(row);
    stockByUbicacion.set(row.id_ubicacion, current);
  }

  for (const [idUbicacion, rows] of stockByUbicacion) {
    if (enriquecimientoByUbicacion.has(idUbicacion)) continue;

    const productIds = new Set(rows.map((row) => row.id_producto));
    const matches = solicitudesDb.filter(
      (solicitud) =>
        isSolicitudActivaEnProcesamiento(solicitud.estado) &&
        productIds.has(solicitud.id_producto_primario),
    );

    if (matches.length !== 1) continue;

    setEnriquecimiento(idUbicacion, matches[0]!.id_solicitud_procesamiento);
  }

  return enriquecimientoByUbicacion;
}

function buildSobranteSlot(
  base: EstadoBodegaSlot,
  meta: ProcesamientoSlotEnriquecimiento,
): EstadoBodegaSlot {
  const baseDetalle = base.detalle!;

  return {
    ...base,
    visual: "ocupada_primario",
    productoLabel: meta.primarioNombre,
    detalle: {
      ...baseDetalle,
      productoNombre: meta.primarioNombre,
      idPaquete: meta.ordenCodigo,
      cantidad: formatKilos(meta.sobranteKg),
      rolProcesamiento: "sobrante",
      resultadoNombre: null,
      sobranteKg: meta.sobranteKg,
    },
  };
}

function buildResultadoSlot(
  base: EstadoBodegaSlot,
  meta: ProcesamientoSlotEnriquecimiento,
): EstadoBodegaSlot {
  const baseDetalle = base.detalle;
  const cantidad =
    meta.unidadesSecundario != null
      ? `${formatUnidades(meta.unidadesSecundario)} ud.`
      : (baseDetalle?.cantidad ?? "—");

  const detalle: EstadoBodegaSlotDetalleView = {
    productoNombre: meta.resultadoNombre,
    idPaquete: meta.ordenCodigo,
    cliente: baseDetalle?.cliente ?? null,
    cantidad,
    posicion: baseDetalle?.posicion ?? base.codigo,
    temperatura: baseDetalle?.temperatura ?? null,
    ordenCompraCodigo: baseDetalle?.ordenCompraCodigo ?? null,
    lockedBy: baseDetalle?.lockedBy ?? null,
    resultadoNombre: meta.resultadoNombre,
    rolProcesamiento: "procesado",
    sobranteKg: null,
  };

  return {
    slotNumber: 0,
    idUbicacion: base.idUbicacion,
    codigo: base.codigo,
    visual: "ocupada_procesado",
    productoLabel: meta.resultadoNombre,
    detalle,
  };
}

export function splitProcesamientoDualCajas(
  section: EstadoBodegaSectionView,
  enriquecimientoByUbicacion: Map<string, ProcesamientoSlotEnriquecimiento>,
): EstadoBodegaSectionView {
  const ubicacionesExpandidas = new Set<string>();
  const expanded: EstadoBodegaSlot[] = [];

  const pushCajasPendienteCierre = (
    base: EstadoBodegaSlot,
    meta: ProcesamientoSlotEnriquecimiento,
    options?: { keepResidualStock?: boolean },
  ) => {
    if (!base.idUbicacion || ubicacionesExpandidas.has(base.idUbicacion)) {
      return;
    }
    ubicacionesExpandidas.add(base.idUbicacion);

    const before = expanded.length;
    if (meta.sobranteKg) {
      expanded.push(buildSobranteSlot(base, meta));
    }
    if (meta.resultadoPendiente) {
      expanded.push(buildResultadoSlot(base, meta));
    }

    // Ambas cajas ya ubicadas: mostrar solo stock físico residual (si queda).
    if (
      options?.keepResidualStock &&
      expanded.length === before &&
      base.visual !== "vacia" &&
      base.detalle
    ) {
      expanded.push(base);
    }
  };

  for (const slot of section.slots) {
    const meta = slot.idUbicacion
      ? enriquecimientoByUbicacion.get(slot.idUbicacion)
      : undefined;

    // Slot físico vacío, pero sigue en pendiente_cierre: mantener Resultado
    // (y Sobrante solo si aún hay primario en mapa).
    if (slot.visual === "vacia" || !slot.detalle) {
      if (meta?.estado === "pendiente_cierre" && slot.idUbicacion) {
        const syntheticBase: EstadoBodegaSlot = {
          ...slot,
          visual: "ocupada_procesado",
          productoLabel: meta.resultadoNombre,
          detalle: {
            productoNombre: meta.resultadoNombre,
            idPaquete: meta.ordenCodigo,
            cliente: null,
            cantidad: "—",
            posicion: slot.codigo,
            temperatura: null,
            ordenCompraCodigo: null,
            lockedBy: null,
          },
        };
        pushCajasPendienteCierre(syntheticBase, meta);
        continue;
      }

      if (slot.visual === "vacia") expanded.push(slot);
      continue;
    }

    if (!meta || meta.estado !== "pendiente_cierre") {
      expanded.push(
        meta
          ? {
              ...slot,
              detalle: {
                ...slot.detalle,
                resultadoNombre: meta.resultadoNombre,
                sobranteKg: null,
                rolProcesamiento: "en_proceso",
              },
            }
          : slot,
      );
      continue;
    }

    pushCajasPendienteCierre(slot, meta, { keepResidualStock: true });
  }

  const slots = padProcesamientoSlots(expanded, section.capacity);
  const occupiedCount = slots.filter((slot) => slot.visual !== "vacia").length;

  return {
    ...section,
    slots,
    occupiedCount,
  };
}
