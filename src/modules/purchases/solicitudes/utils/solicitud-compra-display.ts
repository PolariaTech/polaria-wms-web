import { formatKgEs } from "@/lib/utils/decimal-es";
import { parseCatalogoMetadatos } from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import type {
  SolicitudCompraLineaRow,
  SolicitudCompraRow,
} from "../../shared/types/purchases.types";
import { resumirProductosTabla } from "../../shared/utils/compras-table-display";

export function resolveLineaTitulo(linea: SolicitudCompraLineaRow): string {
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

export function listNombresProductosSolicitud(
  solicitud: SolicitudCompraRow,
): string[] {
  return (solicitud.lineas ?? [])
    .map((linea) => resolveLineaTitulo(linea))
    .filter(Boolean);
}

export function nombresProductosSolicitud(solicitud: SolicitudCompraRow): string {
  const names = listNombresProductosSolicitud(solicitud);
  return names.length ? names.join(" · ") : "—";
}

export function productosSolicitudTablaResumen(
  solicitud: SolicitudCompraRow,
): string {
  return resumirProductosTabla(listNombresProductosSolicitud(solicitud));
}

export function pesosProductosSolicitud(solicitud: SolicitudCompraRow): string {
  const items = solicitud.lineas ?? [];
  if (!items.length) {
    return "—";
  }

  return items
    .map((linea) => `${formatKgEs(Number(linea.cantidad))} kg`)
    .join(" · ");
}

function parseSolicitudCodigoNumero(codigo: string): number {
  const match = /(\d+)\s*$/.exec(codigo.trim());
  return match ? Number(match[1]) : 0;
}

/** Código SOL-XXXX: mayor primero; empate → más reciente primero. */
export function compareSolicitudCompraByCodigoDesc(
  a: Pick<SolicitudCompraRow, "codigo" | "created_at">,
  b: Pick<SolicitudCompraRow, "codigo" | "created_at">,
): number {
  const diff =
    parseSolicitudCodigoNumero(b.codigo) - parseSolicitudCodigoNumero(a.codigo);

  if (diff !== 0) {
    return diff;
  }

  return (
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
