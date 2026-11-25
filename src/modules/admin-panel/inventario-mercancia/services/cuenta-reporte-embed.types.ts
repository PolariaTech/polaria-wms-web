export interface EmbedReportSession {
  codigoCuenta: string;
  idUsuario: string;
  idRol: string | null;
}

export interface CuentaReporteEmbedRow {
  idCuentaReporteEmbed: string;
  codigoCuenta: string;
  descripcion: string | null;
  reporteId: string;
  embedUrl: string;
  estaActivo: boolean;
}

export interface UsuarioCuentaRow {
  id_usuario: string;
  codigo_cuenta: string | null;
  id_rol: string | null;
}

export interface CuentaReporteEmbedDbRow {
  id_cuenta_reporte_embed: string;
  codigo_cuenta: string;
  descripcion: string | null;
  reporte_id: string | null;
  embed_url: string;
  esta_activo?: boolean | null;
}

export const EMBED_SELECT =
  "id_cuenta_reporte_embed,codigo_cuenta,descripcion,reporte_id,embed_url,esta_activo";