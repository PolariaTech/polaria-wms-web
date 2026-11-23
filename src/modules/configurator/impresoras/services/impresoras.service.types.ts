

export type ImpresoraPais = "CO" | "MX" | "US";
export type ImpresoraTipoConexion = "wifi" | "ethernet" | "usb" | "bluetooth";
export type ImpresoraModoEnvio =
  | "sistema_local"
  | "ipp"
  | "raw_9100"
  | "agente"
  | "email"
  | "epson_connect";

/** Camino de configuración en UI (agrupa modos técnicos). */
export type ImpresoraCamino = "qz" | "brother_email" | "epson_connect";
export type ImpresoraTamanoPapel = "letter" | "legal" | "a4";
export type ImpresoraOrientacion = "portrait" | "landscape";
export type ImpresoraDuplex = "none" | "long_edge" | "short_edge";
export type ImpresoraColorModo = "mono" | "color";

export interface ImpresoraListRow {
  idImpresora: string;
  nombre: string;
  codigo: string | null;
  codigoCuenta: string;
  cuentaNombre: string;
  idUsuario: string | null;
  usuarioNombre: string | null;
  idBodega: string | null;
  marca: string | null;
  modelo: string | null;
  pais: ImpresoraPais;
  ubicacionTexto: string | null;
  tipoConexion: ImpresoraTipoConexion;
  modoEnvio: ImpresoraModoEnvio;
  hostIp: string | null;
  puerto: number | null;
  colaNombre: string | null;
  nombreSistema: string | null;
  idAgente: string | null;
  emailDestino: string | null;
  usaTls: boolean;
  tamanoPapel: ImpresoraTamanoPapel;
  orientacion: ImpresoraOrientacion;
  duplex: ImpresoraDuplex;
  colorModo: ImpresoraColorModo;
  bandeja: string | null;
  copiasDefault: number;
  notas: string | null;
  estaActiva: boolean;
}

export interface CreateImpresoraInput {
  nombre: string;
  codigo?: string | null;
  codigoCuenta: string;
  /** Si se omite, la impresora queda a nivel cuenta (todos los usuarios). */
  idUsuario?: string | null;
  idBodega?: string | null;
  marca?: string | null;
  modelo?: string | null;
  pais: ImpresoraPais;
  ubicacionTexto?: string | null;
  tipoConexion: ImpresoraTipoConexion;
  modoEnvio: ImpresoraModoEnvio;
  hostIp?: string | null;
  puerto?: number | null;
  colaNombre?: string | null;
  nombreSistema?: string | null;
  idAgente?: string | null;
  emailDestino?: string | null;
  usaTls?: boolean;
  tamanoPapel?: ImpresoraTamanoPapel;
  orientacion?: ImpresoraOrientacion;
  duplex?: ImpresoraDuplex;
  colorModo?: ImpresoraColorModo;
  bandeja?: string | null;
  copiasDefault?: number;
  notas?: string | null;
  idCreador?: string | null;
}
