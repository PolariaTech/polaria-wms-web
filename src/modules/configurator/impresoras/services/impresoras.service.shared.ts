import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  type CreateImpresoraInput,
  type ImpresoraColorModo,
  type ImpresoraDuplex,
  type ImpresoraListRow,
  type ImpresoraModoEnvio,
  type ImpresoraOrientacion,
  type ImpresoraPais,
  type ImpresoraTamanoPapel,
  type ImpresoraTipoConexion,
} from "./impresoras.service.types";

export interface ImpresoraDbRow {
  id_impresora: string;
  codigo_cuenta: string;
  id_usuario: string | null;
  id_bodega: string | null;
  nombre: string;
  codigo: string | null;
  marca: string | null;
  modelo: string | null;
  pais: ImpresoraPais;
  ubicacion_texto: string | null;
  tipo_conexion: ImpresoraTipoConexion;
  modo_envio: ImpresoraModoEnvio;
  host_ip: string | null;
  puerto: number | null;
  cola_nombre: string | null;
  nombre_sistema: string | null;
  id_agente: string | null;
  email_destino?: string | null;
  usa_tls: boolean;
  tamano_papel: ImpresoraTamanoPapel;
  orientacion: ImpresoraOrientacion;
  duplex: ImpresoraDuplex;
  color_modo: ImpresoraColorModo;
  bandeja: string | null;
  copias_default: number;
  notas: string | null;
  esta_activa: boolean;
}

export const IMPRESORA_LIST_COLUMNS =
  "id_impresora,codigo_cuenta,id_usuario,id_bodega,nombre,codigo,marca,modelo,pais,ubicacion_texto,tipo_conexion,modo_envio,host_ip,puerto,cola_nombre,nombre_sistema,id_agente,email_destino,usa_tls,tamano_papel,orientacion,duplex,color_modo,bandeja,copias_default,notas,esta_activa";

export const IMPRESORA_CREATE_COLUMNS = IMPRESORA_LIST_COLUMNS;

export function mapListRow(
  row: ImpresoraDbRow,
  cuentaNombre: string,
  usuarioNombre: string | null,
): ImpresoraListRow {
  return {
    idImpresora: row.id_impresora,
    nombre: row.nombre,
    codigo: row.codigo,
    codigoCuenta: row.codigo_cuenta,
    cuentaNombre,
    idUsuario: row.id_usuario,
    usuarioNombre,
    idBodega: row.id_bodega,
    marca: row.marca,
    modelo: row.modelo,
    pais: row.pais,
    ubicacionTexto: row.ubicacion_texto,
    tipoConexion: row.tipo_conexion,
    modoEnvio: row.modo_envio,
    hostIp: row.host_ip,
    puerto: row.puerto,
    colaNombre: row.cola_nombre,
    nombreSistema: row.nombre_sistema,
    idAgente: row.id_agente,
    emailDestino: row.email_destino ?? null,
    usaTls: row.usa_tls,
    tamanoPapel: row.tamano_papel,
    orientacion: row.orientacion,
    duplex: row.duplex,
    colorModo: row.color_modo,
    bandeja: row.bandeja,
    copiasDefault: row.copias_default,
    notas: row.notas,
    estaActiva: row.esta_activa,
  };
}

function defaultPuertoForModo(modo: ImpresoraModoEnvio): number | null {
  if (modo === "ipp") return 631;
  if (modo === "raw_9100") return 9100;
  return null;
}

function isValidEmailDestino(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateCreateInput(input: CreateImpresoraInput): {
  nombre: string;
  codigo: string | null;
  codigoCuenta: string;
  idUsuario: string | null;
  idBodega: string | null;
  marca: string | null;
  modelo: string | null;
  ubicacionTexto: string | null;
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
} {
  const nombre = input.nombre.trim();
  const codigoCuenta = input.codigoCuenta.trim();
  const idUsuario = input.idUsuario?.trim() || null;
  const hostIp = input.hostIp?.trim() || null;
  const nombreSistema = input.nombreSistema?.trim() || null;
  const idAgente = input.idAgente?.trim() || null;
  const colaNombre = input.colaNombre?.trim() || null;
  const emailDestino = input.emailDestino?.trim().toLowerCase() || null;
  const copiasDefault = input.copiasDefault ?? 1;
  const puerto =
    input.puerto ?? defaultPuertoForModo(input.modoEnvio);

  if (!nombre) {
    throw new DomainServiceError(
      "El nombre de la impresora es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigoCuenta) {
    throw new DomainServiceError(
      "Selecciona la cuenta a asociar.",
      "INVALID_ARGUMENT",
    );
  }

  if (
    (input.modoEnvio === "ipp" || input.modoEnvio === "raw_9100") &&
    !hostIp
  ) {
    throw new DomainServiceError(
      "La IP o hostname es obligatorio para Wi‑Fi / Ethernet (IPP o puerto 9100).",
      "INVALID_ARGUMENT",
    );
  }

  if (input.modoEnvio === "sistema_local" && !nombreSistema) {
    throw new DomainServiceError(
      "Indica el nombre de la impresora en Windows (QZ Tray).",
      "INVALID_ARGUMENT",
    );
  }

  if (input.modoEnvio === "agente" && !idAgente && !nombreSistema) {
    throw new DomainServiceError(
      "Indica el nombre de la impresora en Windows (QZ Tray).",
      "INVALID_ARGUMENT",
    );
  }

  if (input.modoEnvio === "email" || input.modoEnvio === "epson_connect") {
    if (!emailDestino || !isValidEmailDestino(emailDestino)) {
      throw new DomainServiceError(
        input.modoEnvio === "email"
          ? "Indica el correo de la impresora Brother."
          : "Indica el correo Epson Connect de la impresora.",
        "INVALID_ARGUMENT",
      );
    }
  }

  if (
    puerto != null &&
    (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535)
  ) {
    throw new DomainServiceError(
      "El puerto debe ser un entero entre 1 y 65535.",
      "INVALID_ARGUMENT",
    );
  }

  if (
    !Number.isInteger(copiasDefault) ||
    copiasDefault < 1 ||
    copiasDefault > 99
  ) {
    throw new DomainServiceError(
      "Las copias por defecto deben estar entre 1 y 99.",
      "INVALID_ARGUMENT",
    );
  }

  return {
    nombre,
    codigo: input.codigo?.trim() || null,
    codigoCuenta,
    idUsuario,
    idBodega: input.idBodega?.trim() || null,
    marca: input.marca?.trim() || null,
    modelo: input.modelo?.trim() || null,
    ubicacionTexto: input.ubicacionTexto?.trim() || null,
    hostIp,
    puerto,
    colaNombre,
    nombreSistema,
    idAgente,
    emailDestino,
    usaTls: Boolean(input.usaTls),
    tamanoPapel: input.tamanoPapel ?? "letter",
    orientacion: input.orientacion ?? "portrait",
    duplex: input.duplex ?? "none",
    colorModo: input.colorModo ?? "mono",
    bandeja: input.bandeja?.trim() || null,
    copiasDefault,
    notas: input.notas?.trim() || null,
  };
}

export interface ImpresoraPrintTarget {
  idImpresora: string;
  nombre: string;
  codigoCuenta: string;
  tipoConexion: ImpresoraTipoConexion;
  modoEnvio: ImpresoraModoEnvio;
  hostIp: string | null;
  puerto: number | null;
  colaNombre: string | null;
  nombreSistema: string | null;
  idAgente: string | null;
  emailDestino: string | null;
  usaTls: boolean;
  copiasDefault: number;
  tamanoPapel: ImpresoraTamanoPapel;
}

export const IMPRESORA_PRINT_COLUMNS =
  "id_impresora,codigo_cuenta,nombre,tipo_conexion,modo_envio,host_ip,puerto,cola_nombre,nombre_sistema,id_agente,email_destino,usa_tls,copias_default,tamano_papel,esta_activa";
