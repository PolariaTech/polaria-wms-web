import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

interface TenantEmpresaOption {
  codigoEmpresa: string;
  razonSocial: string;
}

interface UsuarioCuentaDbRow {
  codigo_empresa: string | null;
}

interface UsuarioLoginDbRow {
  cuenta: UsuarioCuentaDbRow | UsuarioCuentaDbRow[] | null;
}

function resolveRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function getServiceRoleKey(): string | null {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
    null
  );
}

async function resolveEmpresas(correo: string): Promise<TenantEmpresaOption[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    return [];
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client
    .from("usuario")
    .select("cuenta!fk_usuario_cuenta(codigo_empresa)")
    .eq("correo", correo)
    .eq("esta_activo", true);

  if (error || !data?.length) {
    return [];
  }

  const byCodigo = new Map<string, TenantEmpresaOption>();

  for (const row of data as UsuarioLoginDbRow[]) {
    const cuenta = resolveRelation(row.cuenta);
    const codigoEmpresa = cuenta?.codigo_empresa?.trim();
    if (!codigoEmpresa) continue;

    byCodigo.set(codigoEmpresa, {
      codigoEmpresa,
      razonSocial: codigoEmpresa,
    });
  }

  if (byCodigo.size === 0) {
    return [];
  }

  const codigos = [...byCodigo.keys()];
  const { data: empresas } = await client
    .from("empresa")
    .select("codigo_empresa,razon_social")
    .in("codigo_empresa", codigos)
    .eq("esta_activa", true);

  for (const empresa of empresas ?? []) {
    const codigo = empresa.codigo_empresa?.trim();
    if (!codigo || !byCodigo.has(codigo)) continue;
    byCodigo.set(codigo, {
      codigoEmpresa: codigo,
      razonSocial: empresa.razon_social?.trim() || codigo,
    });
  }

  return [...byCodigo.values()].sort((a, b) =>
    a.razonSocial.localeCompare(b.razonSocial, "es"),
  );
}

export async function POST(request: Request) {
  let correo = "";

  try {
    const body = (await request.json()) as { correo?: string };
    correo = body.correo?.trim().toLowerCase() ?? "";
  } catch {
    return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  if (!correo) {
    return NextResponse.json({ empresas: [] satisfies TenantEmpresaOption[] });
  }

  const empresas = await resolveEmpresas(correo);
  return NextResponse.json({ empresas });
}
