import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { parseDecimalEs } from "@/lib/utils/decimal-es";
import type { RecepcionLineaApiInput } from "../../shared/types/purchases-api.types";
import type { OrdenCompraLineaRow, OrdenCompraRow } from "../../shared/types/purchases.types";
import {
  formatFechaOrden,
  resolveOrdenLineaTitulo,
} from "../../ordenes/utils/orden-compra-display";

export interface RecepcionLineaDraft {
  idLineaOrdenCompra: string;
  titulo: string;
  sku: string | null;
  cantidadPedida: number;
  cantidadYaRecibida: number;
  incluida: boolean;
  cantidadRecibidaInput: string;
  temperaturaInput: string;
}

export interface ProductoAdicionalDraft {
  idProducto: string;
  label: string;
  temperaturaInput: string;
  pesoInput: string;
}

function pendingCantidad(linea: OrdenCompraLineaRow): number {
  const pedida = linea.cantidad;
  const recibida = linea.cantidad_recibida ?? 0;
  return Math.max(0, pedida - recibida);
}

export function formatOrdenIngresoSelectLabel(orden: OrdenCompraRow): string {
  const proveedor = orden.proveedor_nombre?.trim() || "Sin proveedor";
  return `${orden.codigo} · ${orden.codigo_cuenta} · ${proveedor}`;
}

export function formatOrdenIngresoResumen(orden: OrdenCompraRow): string {
  const llegada = formatFechaOrden(orden.fecha_entrega_estimada);
  return `${orden.codigo} · Llegada estipulada: ${llegada}`;
}

export function formatLineaIngresoTitulo(linea: RecepcionLineaDraft): string {
  const titulo = linea.titulo.trim();
  const sku = linea.sku?.trim();

  if (sku && titulo && !titulo.toUpperCase().startsWith(sku.toUpperCase())) {
    return `${sku} ${titulo}`;
  }

  return titulo || sku || "Sin título";
}

export function buildRecepcionLineasDraft(
  lineas: OrdenCompraLineaRow[],
): RecepcionLineaDraft[] {
  return lineas.map((linea) => {
    const pendiente = pendingCantidad(linea);
    const tienePendiente = pendiente > 0;

    return {
      idLineaOrdenCompra: linea.id_linea_orden_compra,
      titulo: resolveOrdenLineaTitulo(linea),
      sku: linea.producto?.sku?.trim() ?? null,
      cantidadPedida: linea.cantidad,
      cantidadYaRecibida: linea.cantidad_recibida ?? 0,
      incluida: tienePendiente,
      cantidadRecibidaInput: "",
      temperaturaInput: "",
    };
  });
}

export function buildNotasProductoAdicional(
  producto: ProductoAdicionalDraft | null,
): string | null {
  if (!producto?.idProducto.trim()) {
    return null;
  }

  const peso = parseDecimalEs(producto.pesoInput);
  if (peso == null || !Number.isFinite(peso) || peso <= 0) {
    return null;
  }

  const temperatura = parseDecimalEs(producto.temperaturaInput);
  if (
    temperatura == null ||
    !Number.isFinite(temperatura) ||
    Number.isNaN(temperatura)
  ) {
    return null;
  }

  return `Producto adicional: ${producto.label}; ${peso} kg; temp ${temperatura}°C`;
}

function isTemperaturaIngresoValida(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const temperatura = parseDecimalEs(trimmed);
  return temperatura != null && Number.isFinite(temperatura) && !Number.isNaN(temperatura);
}

function isPesoIngresoValido(value: string): boolean {
  const peso = parseDecimalEs(value);
  return peso != null && Number.isFinite(peso) && peso > 0;
}

function isLineaIngresoCompleta(linea: RecepcionLineaDraft): boolean {
  return (
    isTemperaturaIngresoValida(linea.temperaturaInput) &&
    isPesoIngresoValido(linea.cantidadRecibidaInput)
  );
}

function isProductoAdicionalCompleto(
  producto: ProductoAdicionalDraft | null,
): boolean {
  if (!producto?.idProducto.trim()) {
    return false;
  }

  return (
    isTemperaturaIngresoValida(producto.temperaturaInput) &&
    isPesoIngresoValido(producto.pesoInput)
  );
}

export function parseRecepcionLineasPayload(
  lineas: RecepcionLineaDraft[],
): RecepcionLineaApiInput[] {
  const incluidas = lineas.filter((linea) => linea.incluida);

  if (incluidas.length === 0) {
    throw new DomainServiceError(
      "Selecciona al menos una línea para registrar el ingreso.",
      "INVALID_ARGUMENT",
    );
  }

  return incluidas.map((linea, index) => {
    const cantidadRecibida = parseDecimalEs(linea.cantidadRecibidaInput);

    if (
      cantidadRecibida == null ||
      !Number.isFinite(cantidadRecibida) ||
      cantidadRecibida < 0
    ) {
      throw new DomainServiceError(
        `El peso recibido de la línea ${index + 1} no es válido.`,
        "INVALID_ARGUMENT",
      );
    }

    const temperatura = parseDecimalEs(linea.temperaturaInput);

    if (
      temperatura == null ||
      !Number.isFinite(temperatura) ||
      Number.isNaN(temperatura)
    ) {
      throw new DomainServiceError(
        `La temperatura de la línea ${index + 1} es obligatoria.`,
        "INVALID_ARGUMENT",
      );
    }

    return {
      idLineaOrdenCompra: linea.idLineaOrdenCompra,
      cantidadRecibida,
      temperaturaRegistrada: temperatura,
    };
  });
}

export function canSubmitRecepcionDraft(
  lineas: RecepcionLineaDraft[],
  productoAdicional: ProductoAdicionalDraft | null,
): boolean {
  const incluidas = lineas.filter((linea) => linea.incluida);

  if (incluidas.length > 0) {
    return incluidas.every(isLineaIngresoCompleta);
  }

  return isProductoAdicionalCompleto(productoAdicional);
}
