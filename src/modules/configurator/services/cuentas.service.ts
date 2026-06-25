import {
  DEFAULT_LIST_LIMIT,
  runDomainQuery,
} from "@/lib/supabase/domain-query";

export interface CuentaListRow {
  codigoCuenta: string;
  nombreComercial: string;
  bodegaAsignada: string;
  tieneCredenciales: boolean;
}

interface CuentaBodegaDbRow {
  nombre: string;
  esta_activa: boolean;
}

interface CuentaUsuarioDbRow {
  esta_activo: boolean;
}

interface CuentaDbRow {
  codigo_cuenta: string;
  nombre_comercial: string;
  bodega: CuentaBodegaDbRow[] | null;
  usuario: CuentaUsuarioDbRow[] | null;
}

/**
 * PostgREST: cuenta↔usuario tiene dos FK (id_creador y usuario.codigo_cuenta).
 * Hay que nombrar la relación explícita para los usuarios de la cuenta.
 */
const CUENTA_LIST_COLUMNS =
  "codigo_cuenta,nombre_comercial,bodega(nombre,esta_activa),usuario!fk_usuario_cuenta(esta_activo)";

function mapCuentaRow(row: CuentaDbRow): CuentaListRow {
  const bodegasActivas = (row.bodega ?? []).filter((item) => item.esta_activa);
  const usuariosActivos = (row.usuario ?? []).filter((item) => item.esta_activo);

  return {
    codigoCuenta: row.codigo_cuenta,
    nombreComercial: row.nombre_comercial,
    bodegaAsignada:
      bodegasActivas.map((item) => item.nombre).join(", ") || "—",
    tieneCredenciales: usuariosActivos.length > 0,
  };
}

/** Lista cuentas comerciales activas para el configurador (scope platform). */
export async function listCuentasConfigurator(): Promise<CuentaListRow[]> {
  const rows = await runDomainQuery<CuentaDbRow[]>((client) => {
    const query = client
      .from("cuenta")
      .select(CUENTA_LIST_COLUMNS)
      .eq("esta_activa", true)
      .order("nombre_comercial", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: CuentaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapCuentaRow);
}
