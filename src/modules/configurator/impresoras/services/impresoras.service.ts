import {
  DEFAULT_LIST_LIMIT,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { resolveNombresCuentaAcrossSchemas } from "@/lib/supabase/tenant-fanout";
import { DomainServiceError } from "@/lib/utils/domain-service-error";

export type ImpresoraPais = "CO" | "MX" | "US";
export type ImpresoraTipoConexion = "wifi" | "ethernet" | "usb" | "bluetooth";
export type ImpresoraModoEnvio =
  | "sistema_local"
  | "ipp"
  | "raw_9100"
  | "agente";
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

interface ImpresoraDbRow {
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

const IMPRESORA_LIST_COLUMNS =
  "id_impresora,codigo_cuenta,id_usuario,id_bodega,nombre,codigo,marca,modelo,pais,ubicacion_texto,tipo_conexion,modo_envio,host_ip,puerto,cola_nombre,nombre_sistema,id_agente,usa_tls,tamano_papel,orientacion,duplex,color_modo,bandeja,copias_default,notas,esta_activa";

const IMPRESORA_CREATE_COLUMNS = IMPRESORA_LIST_COLUMNS;

function mapListRow(
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

function validateCreateInput(input: CreateImpresoraInput): {
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
      "Indica el nombre de la impresora en el sistema operativo (USB / cola local).",
      "INVALID_ARGUMENT",
    );
  }

  if (input.modoEnvio === "agente" && !idAgente && !nombreSistema) {
    throw new DomainServiceError(
      "Indica el ID del agente (QZ Tray / PrintNode) o el nombre de cola del agente.",
      "INVALID_ARGUMENT",
    );
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
  usaTls: boolean;
  copiasDefault: number;
  tamanoPapel: ImpresoraTamanoPapel;
}

const IMPRESORA_PRINT_COLUMNS =
  "id_impresora,codigo_cuenta,nombre,tipo_conexion,modo_envio,host_ip,puerto,cola_nombre,nombre_sistema,id_agente,usa_tls,copias_default,tamano_papel,esta_activa";

/** Impresora activa de la cuenta (nivel cuenta: id_usuario null primero). */
export async function getImpresoraActivaCuenta(
  codigoCuenta: string,
): Promise<ImpresoraPrintTarget | null> {
  const codigo = codigoCuenta.trim();
  if (!codigo) return null;

  const rows = await runDomainQuery<
    Array<{
      id_impresora: string;
      codigo_cuenta: string;
      nombre: string;
      tipo_conexion: ImpresoraTipoConexion;
      modo_envio: ImpresoraModoEnvio;
      host_ip: string | null;
      puerto: number | null;
      cola_nombre: string | null;
      nombre_sistema: string | null;
      id_agente: string | null;
      usa_tls: boolean;
      copias_default: number;
      tamano_papel: ImpresoraTamanoPapel;
      esta_activa: boolean;
      id_usuario?: string | null;
    }>
  >((client) => {
    const query = client
      .from("impresora")
      .select(`${IMPRESORA_PRINT_COLUMNS},id_usuario`)
      .eq("codigo_cuenta", codigo)
      .eq("esta_activa", true)
      .order("nombre", { ascending: true })
      .limit(20);

    return query as unknown as Promise<{
      data:
        | Array<{
            id_impresora: string;
            codigo_cuenta: string;
            nombre: string;
            tipo_conexion: ImpresoraTipoConexion;
            modo_envio: ImpresoraModoEnvio;
            host_ip: string | null;
            puerto: number | null;
            cola_nombre: string | null;
            nombre_sistema: string | null;
            id_agente: string | null;
            usa_tls: boolean;
            copias_default: number;
            tamano_papel: ImpresoraTamanoPapel;
            esta_activa: boolean;
            id_usuario?: string | null;
          }>
        | null;
      error: { message: string } | null;
    }>;
  });

  if (rows.length === 0) return null;

  const preferred =
    rows.find((row) => !row.id_usuario) ?? rows[0];

  return {
    idImpresora: preferred.id_impresora,
    nombre: preferred.nombre,
    codigoCuenta: preferred.codigo_cuenta,
    tipoConexion: preferred.tipo_conexion,
    modoEnvio: preferred.modo_envio,
    hostIp: preferred.host_ip,
    puerto: preferred.puerto,
    colaNombre: preferred.cola_nombre,
    nombreSistema: preferred.nombre_sistema,
    idAgente: preferred.id_agente,
    usaTls: preferred.usa_tls,
    copiasDefault: preferred.copias_default,
    tamanoPapel: preferred.tamano_papel,
  };
}

/** Lista impresoras configuradas (tabla plataforma public.impresora). */
export async function listImpresorasConfigurator(): Promise<ImpresoraListRow[]> {
  const rows = await runDomainQuery<ImpresoraDbRow[]>((client) => {
    const query = client
      .from("impresora")
      .select(IMPRESORA_LIST_COLUMNS)
      .order("nombre", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: ImpresoraDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  const nombres = await resolveNombresCuentaAcrossSchemas([
    ...new Set(rows.map((row) => row.codigo_cuenta).filter(Boolean)),
  ]);

  const usuarioIds = [
    ...new Set(
      rows
        .map((row) => row.id_usuario?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const usuarioNombres = await resolveUsuarioNombres(usuarioIds);

  return rows.map((row) =>
    mapListRow(
      row,
      nombres.get(row.codigo_cuenta) ?? row.codigo_cuenta,
      row.id_usuario
        ? (usuarioNombres.get(row.id_usuario) ?? null)
        : "Toda la cuenta",
    ),
  );
}

async function resolveUsuarioNombres(
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  const rows = await runDomainQuery<{ id_usuario: string; nombre: string }[]>(
    (client) => {
      const query = client
        .from("usuario")
        .select("id_usuario,nombre")
        .in("id_usuario", ids)
        .limit(DEFAULT_LIST_LIMIT);

      return query as unknown as Promise<{
        data: { id_usuario: string; nombre: string }[] | null;
        error: { message: string } | null;
      }>;
    },
  );

  for (const row of rows) {
    map.set(row.id_usuario, row.nombre);
  }
  return map;
}

/** Crea una impresora carta desde el configurador. */
export async function createImpresoraConfigurator(
  input: CreateImpresoraInput,
): Promise<ImpresoraListRow> {
  const validated = validateCreateInput(input);

  const inserted = await runDomainMutation<ImpresoraDbRow | null>((client) => {
    const query = client
      .from("impresora")
      .insert({
        codigo_cuenta: validated.codigoCuenta,
        id_usuario: validated.idUsuario,
        id_bodega: validated.idBodega,
        nombre: validated.nombre,
        codigo: validated.codigo,
        marca: validated.marca,
        modelo: validated.modelo,
        pais: input.pais,
        ubicacion_texto: validated.ubicacionTexto,
        tipo_conexion: input.tipoConexion,
        modo_envio: input.modoEnvio,
        host_ip: validated.hostIp,
        puerto: validated.puerto,
        cola_nombre: validated.colaNombre,
        nombre_sistema: validated.nombreSistema,
        id_agente: validated.idAgente,
        usa_tls: validated.usaTls,
        tamano_papel: validated.tamanoPapel,
        orientacion: validated.orientacion,
        duplex: validated.duplex,
        color_modo: validated.colorModo,
        bandeja: validated.bandeja,
        copias_default: validated.copiasDefault,
        notas: validated.notas,
        id_creador: input.idCreador ?? null,
        esta_activa: true,
      })
      .select(IMPRESORA_CREATE_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: ImpresoraDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!inserted) {
    throw new DomainServiceError(
      "No se pudo crear la impresora.",
      "MUTATION_FAILED",
    );
  }

  const nombres = await resolveNombresCuentaAcrossSchemas([
    inserted.codigo_cuenta,
  ]);
  const usuarioNombres = inserted.id_usuario
    ? await resolveUsuarioNombres([inserted.id_usuario])
    : new Map<string, string>();

  return mapListRow(
    inserted,
    nombres.get(inserted.codigo_cuenta) ?? inserted.codigo_cuenta,
    inserted.id_usuario
      ? (usuarioNombres.get(inserted.id_usuario) ?? null)
      : "Toda la cuenta",
  );
}

export type UpdateImpresoraInput = CreateImpresoraInput & {
  idImpresora: string;
  estaActiva?: boolean;
};

/** Actualiza una impresora existente del configurador. */
export async function updateImpresoraConfigurator(
  input: UpdateImpresoraInput,
): Promise<ImpresoraListRow> {
  const idImpresora = input.idImpresora.trim();
  if (!idImpresora) {
    throw new DomainServiceError(
      "Falta el id de la impresora.",
      "INVALID_ARGUMENT",
    );
  }

  const validated = validateCreateInput(input);

  const updated = await runDomainMutation<ImpresoraDbRow | null>((client) => {
    const query = client
      .from("impresora")
      .update({
        codigo_cuenta: validated.codigoCuenta,
        id_usuario: null,
        id_bodega: validated.idBodega,
        nombre: validated.nombre,
        codigo: validated.codigo,
        marca: validated.marca,
        modelo: validated.modelo,
        pais: input.pais,
        ubicacion_texto: validated.ubicacionTexto,
        tipo_conexion: input.tipoConexion,
        modo_envio: input.modoEnvio,
        host_ip: validated.hostIp,
        puerto: validated.puerto,
        cola_nombre: validated.colaNombre,
        nombre_sistema: validated.nombreSistema,
        id_agente: validated.idAgente,
        usa_tls: validated.usaTls,
        tamano_papel: validated.tamanoPapel,
        orientacion: validated.orientacion,
        duplex: validated.duplex,
        color_modo: validated.colorModo,
        bandeja: validated.bandeja,
        copias_default: validated.copiasDefault,
        notas: validated.notas,
        esta_activa: input.estaActiva ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id_impresora", idImpresora)
      .select(IMPRESORA_CREATE_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: ImpresoraDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!updated) {
    throw new DomainServiceError(
      "No se pudo actualizar la impresora.",
      "MUTATION_FAILED",
    );
  }

  const nombres = await resolveNombresCuentaAcrossSchemas([
    updated.codigo_cuenta,
  ]);

  return mapListRow(
    updated,
    nombres.get(updated.codigo_cuenta) ?? updated.codigo_cuenta,
    "Toda la cuenta",
  );
}

export function suggestModoEnvio(
  tipo: ImpresoraTipoConexion,
): ImpresoraModoEnvio {
  if (tipo === "usb") return "sistema_local";
  if (tipo === "bluetooth") return "agente";
  return "ipp";
}

export function labelTipoConexion(tipo: ImpresoraTipoConexion): string {
  switch (tipo) {
    case "wifi":
      return "Wi‑Fi";
    case "ethernet":
      return "Ethernet (cable)";
    case "usb":
      return "USB";
    case "bluetooth":
      return "Bluetooth";
  }
}

export function labelModoEnvio(modo: ImpresoraModoEnvio): string {
  switch (modo) {
    case "ipp":
      return "IPP / IPPS";
    case "raw_9100":
      return "JetDirect (9100)";
    case "sistema_local":
      return "Cola del sistema";
    case "agente":
      return "Agente local";
  }
}

export function labelPais(pais: ImpresoraPais): string {
  switch (pais) {
    case "CO":
      return "Colombia";
    case "MX":
      return "México";
    case "US":
      return "Estados Unidos";
  }
}
