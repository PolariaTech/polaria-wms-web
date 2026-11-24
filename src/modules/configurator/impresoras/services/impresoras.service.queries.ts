import { DEFAULT_LIST_LIMIT, runDomainQuery } from "@/lib/supabase/domain-query";
import { resolveNombresCuentaAcrossSchemas } from "@/lib/supabase/tenant-fanout";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  type ImpresoraListRow,
  type ImpresoraModoEnvio,
  type ImpresoraTamanoPapel,
  type ImpresoraTipoConexion,
} from "./impresoras.service.types";
import {
  IMPRESORA_LIST_COLUMNS,
  IMPRESORA_PRINT_COLUMNS,
  type ImpresoraDbRow,
  type ImpresoraPrintTarget,
  mapListRow,
} from "./impresoras.service.shared";

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
      email_destino: string | null;
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
            email_destino: string | null;
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
    emailDestino: preferred.email_destino ?? null,
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

export async function resolveUsuarioNombres(
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

/**
 * Una sola impresora activa por cuenta (nivel cuenta).
 * Para cambiar de método o máquina hay que eliminar la actual.
 */
export async function assertCuentaSinImpresoraActiva(params: {
  codigoCuenta: string;
  excludeIdImpresora?: string | null;
}): Promise<void> {
  const codigoCuenta = params.codigoCuenta.trim();
  if (!codigoCuenta) return;

  const rows = await runDomainQuery<
    Array<{ id_impresora: string; nombre: string }>
  >((client) => {
    let query = client
      .from("impresora")
      .select("id_impresora,nombre")
      .eq("codigo_cuenta", codigoCuenta)
      .eq("esta_activa", true)
      .is("id_usuario", null)
      .limit(5);

    const exclude = params.excludeIdImpresora?.trim();
    if (exclude) {
      query = query.neq("id_impresora", exclude);
    }

    return query as unknown as Promise<{
      data: Array<{ id_impresora: string; nombre: string }> | null;
      error: { message: string } | null;
    }>;
  });

  const existing = rows[0];
  if (!existing) return;

  throw new DomainServiceError(
    `La cuenta ya tiene la impresora «${existing.nombre}» activa. Elimínala para configurar otra. Al imprimir se usa automáticamente esa única impresora.`,
    "INVALID_ARGUMENT",
  );
}
