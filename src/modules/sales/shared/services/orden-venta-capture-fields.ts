import {
  serializeOrigenArchivos,
  type OrigenAdjunto,
} from "../../ordenes/utils/origen/origen-adjuntos";
import { sanitizeTelefonoContacto } from "../../ordenes/utils/pedido/sanitize-telefono-contacto";
import type { CreateOrdenVentaInput } from "../types/sales.types";

function normalizeOrigenAdjuntosInput(
  raw: CreateOrdenVentaInput["origenArchivos"],
): OrigenAdjunto[] {
  if (!raw || raw.length === 0) return [];
  return raw
    .map((item) =>
      typeof item === "string"
        ? { nombre: item.trim() }
        : {
            nombre: item.nombre.trim(),
            url: item.url ?? null,
            path: item.path ?? null,
            mime: item.mime ?? null,
            bytes: item.bytes ?? null,
            resourceType: item.resourceType ?? null,
          },
    )
    .filter((item) => item.nombre);
}

export function ordenVentaCaptureFields(
  input: CreateOrdenVentaInput,
): Record<string, string | null | unknown> {
  const origenArchivos = serializeOrigenArchivos(
    normalizeOrigenAdjuntosInput(input.origenArchivos),
  );

  const fields: Record<string, string | null | unknown> = {
    fecha_entrega: input.fechaEntrega?.trim() || null,
    ventana_desde: input.ventanaDesde?.trim() || null,
    ventana_hasta: input.ventanaHasta?.trim() || null,
    prioridad: input.prioridad?.trim() || null,
    orden_compra_hotel: input.ordenCompraHotel?.trim() || null,
    centro_consumo: input.centroConsumo?.trim() || null,
    vendedor: input.vendedor?.trim() || null,
    moneda: input.moneda?.trim() || null,
    bodega_destino_label: input.bodegaDestinoLabel?.trim() || null,
    direccion_entrega: input.direccionEntrega?.trim() || null,
    anden: input.anden?.trim() || null,
    contacto_entrega: input.contacto?.trim() || null,
    telefono_contacto: sanitizeTelefonoContacto(input.telefono) || null,
    correo_contacto: input.correo?.trim() || null,
    turno: input.turno?.trim() || null,
    hora_salida: input.horaSalida?.trim() || null,
    chofer: input.chofer?.trim() || null,
    unidad: input.unidad?.trim() || null,
    acepta_sustituciones: input.aceptaSustituciones?.trim() || null,
    requiere_lote: input.requiereLote?.trim() || null,
    registrar_temperatura: input.registrarTemperatura?.trim() || null,
    origen_texto: input.origenTexto?.trim() || null,
    origen_archivos: origenArchivos,
    origen_correo:
      input.origenCorreo && input.origenCorreo.length > 0
        ? input.origenCorreo
        : null,
    notas_lineas: input.notasLineas?.trim() || null,
    notas_almacen: input.notasAlmacen?.trim() || null,
  };
  if (input.denominacionComercialOverride !== undefined) {
    fields.denominacion_comercial_override =
      input.denominacionComercialOverride?.trim() || null;
  }
  return fields;
}
