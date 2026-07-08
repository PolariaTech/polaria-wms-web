import { formatKgEs } from "@/lib/utils/decimal-es";
import { parseCatalogoMetadatos } from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import type {
  DestinoTipoOrden,
  OrdenCompraLineaRow,
  OrdenCompraRow,
} from "../../shared/types/purchases.types";
import { resumirProductosTabla } from "../../shared/utils/compras-table-display";

export function resolveOrdenLineaTitulo(linea: OrdenCompraLineaRow): string {
  const producto = linea.producto;
  if (!producto) {
    return "Sin título";
  }

  const meta = parseCatalogoMetadatos(producto.metadatos_catalogo);
  return (
    meta.titulo?.trim() ||
    producto.descripcion?.trim() ||
    producto.sku?.trim() ||
    "Sin título"
  );
}

export function listNombresProductosOrden(orden: OrdenCompraRow): string[] {
  return (orden.lineas ?? [])
    .map((linea) => resolveOrdenLineaTitulo(linea))
    .filter(Boolean);
}

export function nombresProductosOrden(orden: OrdenCompraRow): string {
  const names = listNombresProductosOrden(orden);
  return names.length ? names.join(" · ") : "—";
}

export function productosOrdenTablaResumen(orden: OrdenCompraRow): string {
  return resumirProductosTabla(listNombresProductosOrden(orden));
}

export function formatFechaOrden(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** Valor para `<input type="date">` desde ISO o fecha almacenada. */
export function toFechaOrdenInputValue(
  value: string | null | undefined,
): string {
  if (!value?.trim()) {
    return "";
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Convierte yyyy-mm-dd del input a ISO para persistir en BD. */
export function fechaOrdenInputToStorage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  return `${trimmed}T12:00:00.000Z`;
}

export function formatObservacionOrden(
  observaciones: string | null | undefined,
): string {
  const trimmed = observaciones?.trim();
  return trimmed || "—";
}

export function parseDestinoTipoOrden(destinoTipo: string): DestinoTipoOrden {
  const normalized = destinoTipo.trim().toLowerCase();

  if (normalized.includes("extern")) {
    return "externa";
  }

  return "interna";
}

export function formatDestinoTipoOrden(destinoTipo: string | DestinoTipoOrden): string {
  const value =
    destinoTipo === "interna" || destinoTipo === "externa"
      ? destinoTipo
      : parseDestinoTipoOrden(destinoTipo);

  return formatDestinoTipoOrdenValue(value);
}

export function formatDestinoTipoOrdenValue(destinoTipo: DestinoTipoOrden): string {
  return destinoTipo === "externa" ? "Bodega externa" : "Bodega interna";
}

export function isOrdenDestinoListoParaEmitir(
  orden: Pick<OrdenCompraRow, "destino_tipo" | "id_bodega">,
): boolean {
  const tipo = parseDestinoTipoOrden(orden.destino_tipo);
  return Boolean(orden.id_bodega?.trim()) && (tipo === "interna" || tipo === "externa");
}

export function formatBodegaDestinoLabel(bodega: {
  nombre: string;
  codigo: string;
  slotsLibres: number;
}): string {
  const nombre = bodega.nombre.trim() || bodega.codigo.trim() || "Bodega";
  const slotsLabel =
    bodega.slotsLibres === 1
      ? "1 slot libre"
      : `${bodega.slotsLibres} slots libres`;
  return `${nombre} · ${slotsLabel}`;
}

export function destinoTipoOrdenToStorage(destinoTipo: DestinoTipoOrden): string {
  return destinoTipo;
}

export function formatCantidadesOrden(orden: OrdenCompraRow): string {
  const items = orden.lineas ?? [];
  if (!items.length) {
    return "—";
  }

  return items
    .map((linea) => `${formatKgEs(Number(linea.cantidad))} kg`)
    .join(" · ");
}
