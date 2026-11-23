import type {
  CuentaReporteEmbedDbRow,
  CuentaReporteEmbedRow,
} from "./cuenta-reporte-embed.types";

export function mapEmbedRow(row: CuentaReporteEmbedDbRow): CuentaReporteEmbedRow {
  return {
    idCuentaReporteEmbed: row.id_cuenta_reporte_embed,
    codigoCuenta: row.codigo_cuenta,
    descripcion: row.descripcion?.trim() || null,
    reporteId: row.reporte_id ?? "",
    embedUrl: row.embed_url.trim(),
    estaActivo: row.esta_activo !== false,
  };
}