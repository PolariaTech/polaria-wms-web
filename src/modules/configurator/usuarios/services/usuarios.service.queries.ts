import type { WmsRol } from "@/constants/wms/roles";
import { DEFAULT_LIST_LIMIT, runDomainQuery } from "@/lib/supabase/domain-query";
import {
  listBodegasAcrossSchemas,
  listCuentasAcrossSchemas,
  resolveNombresCuentaAcrossSchemas,
} from "@/lib/supabase/tenant-fanout";
import { WMS_ROL_LABELS, WMS_ROLES_ORDER } from "@/constants/wms/wms-roles";
import {
  type BodegaAssignOption,
  type CuentaAssignOption,
  type RolOption,
  USUARIO_LIST_COLUMNS,
  type UsuarioDbRow,
  type UsuarioListRow,
  mapUsuarioRow,
} from "./usuarios.service.shared";

/** Lista usuarios activos para el configurador (scope platform). */
export async function listUsuariosConfigurator(): Promise<UsuarioListRow[]> {
  const rows = await runDomainQuery<UsuarioDbRow[]>((client) => {
    const query = client
      .from("usuario")
      .select(USUARIO_LIST_COLUMNS)
      .order("nombre", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: UsuarioDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  const codigosCuenta = [
    ...new Set(
      rows
        .map((row) => row.codigo_cuenta?.trim())
        .filter((codigo): codigo is string => Boolean(codigo)),
    ),
  ];

  const nombreCuentaByCodigo =
    await resolveNombresCuentaAcrossSchemas(codigosCuenta);

  return rows.map((row) => mapUsuarioRow(row, nombreCuentaByCodigo));
}

/** Opciones de rol para formularios (9 roles WMS). */
export async function listRolesConfigurator(): Promise<RolOption[]> {
  const rows = await runDomainQuery<{ id_rol: WmsRol; nombre: string }[]>(
    (client) => {
      const query = client
        .from("rol")
        .select("id_rol,nombre")
        .order("nombre", { ascending: true });

      return query as unknown as Promise<{
        data: { id_rol: WmsRol; nombre: string }[] | null;
        error: { message: string } | null;
      }>;
    },
  );

  if (rows.length > 0) {
    const byId = new Map(rows.map((row) => [row.id_rol, row.nombre]));
    return WMS_ROLES_ORDER.filter((idRol) => byId.has(idRol)).map((idRol) => ({
      idRol,
      nombre: byId.get(idRol) ?? WMS_ROL_LABELS[idRol],
    }));
  }

  return WMS_ROLES_ORDER.map((idRol) => ({
    idRol,
    nombre: WMS_ROL_LABELS[idRol],
  }));
}

/** Cuentas activas para el campo Asignado (public + emp_*). */
export async function listCuentasAssignOptions(): Promise<CuentaAssignOption[]> {
  const rows = await listCuentasAcrossSchemas();
  return rows.map((row) => ({
    codigoCuenta: row.codigo_cuenta,
    nombreComercial: row.nombre_comercial,
    idBodegaDefault: row.id_bodega_default?.trim() || null,
  }));
}

/** Bodegas activas para asignación de roles de nivel bodega (public + emp_*). */
export async function listBodegasAssignOptions(): Promise<BodegaAssignOption[]> {
  const rows = await listBodegasAcrossSchemas();
  return rows.map((row) => ({
    idBodega: row.id_bodega.trim(),
    nombre: row.nombre,
    codigo: row.codigo,
    codigoCuenta: row.codigo_cuenta,
  }));
}
