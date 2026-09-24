import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUsuarioCuentaForPermisos,
  listCuentaReporteEmbeds,
  listUsuarioReporteEmbedGrantIds,
  replaceUsuarioReporteEmbedGrants,
  resolveEmbedReportSession,
} from "@/modules/admin-panel/inventario-mercancia/services/cuenta-reporte-embed.server";
import { canManageReporteEmbedPermisos } from "@/modules/admin-panel/inventario-mercancia/services/usuario-reporte-embed-access";

function unauthorized(message = "Sesión requerida.") {
  return NextResponse.json({ message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ message }, { status: 403 });
}

async function requireAdminSession(request: Request) {
  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return { ok: false as const, error: unauthorized() };
  }

  const session = await resolveEmbedReportSession(accessToken);
  if (!session) {
    return { ok: false as const, error: unauthorized("Sesión inválida.") };
  }

  if (!canManageReporteEmbedPermisos(session.idRol)) {
    return {
      ok: false as const,
      error: forbidden(
        "Solo el administrador de cuenta puede gestionar permisos de reportes.",
      ),
    };
  }

  return { ok: true as const, session };
}

/**
 * GET /reportes-embed/permisos?idUsuario=
 * Lista reportes de la cuenta y los grants del usuario elegido.
 *
 * PUT /reportes-embed/permisos
 * Reemplaza los grants del usuario.
 */
export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.error;
  const { session } = auth;

  const idUsuario = new URL(request.url).searchParams.get("idUsuario")?.trim();
  if (!idUsuario) {
    return NextResponse.json(
      { message: "idUsuario es requerido." },
      { status: 400 },
    );
  }

  const target = await getUsuarioCuentaForPermisos(idUsuario);
  if (!target || target.codigoCuenta !== session.codigoCuenta) {
    return forbidden("El usuario no pertenece a esta cuenta.");
  }

  const reports = await listCuentaReporteEmbeds(session.codigoCuenta);
  const grantedIds = await listUsuarioReporteEmbedGrantIds(
    idUsuario,
    session.codigoCuenta,
  );

  return NextResponse.json({
    idUsuario,
    reports: reports.map((row) => ({
      id: row.idCuentaReporteEmbed,
      descripcion: row.descripcion,
      reporteId: row.reporteId,
    })),
    grantedIds,
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.error;
  const { session } = auth;

  let idUsuario = "";
  let reportIds: string[] = [];
  try {
    const body = (await request.json()) as {
      idUsuario?: string;
      reportIds?: string[];
    };
    idUsuario = body.idUsuario?.trim() || "";
    reportIds = Array.isArray(body.reportIds) ? body.reportIds : [];
  } catch {
    return NextResponse.json({ message: "Cuerpo inválido." }, { status: 400 });
  }

  if (!idUsuario) {
    return NextResponse.json(
      { message: "idUsuario es requerido." },
      { status: 400 },
    );
  }

  const target = await getUsuarioCuentaForPermisos(idUsuario);
  if (!target || target.codigoCuenta !== session.codigoCuenta) {
    return forbidden("El usuario no pertenece a esta cuenta.");
  }

  try {
    const grantedIds = await replaceUsuarioReporteEmbedGrants({
      idUsuario,
      codigoCuenta: session.codigoCuenta,
      reportIds,
    });
    return NextResponse.json({ idUsuario, grantedIds });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron guardar los permisos.",
      },
      { status: 400 },
    );
  }
}
