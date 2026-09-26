import { NextResponse } from "next/server";
import {
  createCuentaReporteEmbed,
  extractBearerToken,
  listCuentaReporteEmbedsAdmin,
  resolveEmbedReportSession,
  updateCuentaReporteEmbed,
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
        "Solo el administrador de cuenta puede cargar reportes.",
      ),
    };
  }

  return { ok: true as const, session };
}

function toDto(row: {
  idCuentaReporteEmbed: string;
  descripcion: string | null;
  reporteId: string;
  embedUrl: string;
  estaActivo: boolean;
}) {
  return {
    id: row.idCuentaReporteEmbed,
    descripcion: row.descripcion,
    reporteId: row.reporteId,
    embedUrl: row.embedUrl,
    estaActivo: row.estaActivo,
  };
}

/**
 * GET /reportes-embed/gestion — lista reportes de la cuenta (admin).
 * POST /reportes-embed/gestion — alta de un reporte por URL.
 * PUT /reportes-embed/gestion — edita descripción, URL y estado.
 */
export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.error;

  try {
    const reports = await listCuentaReporteEmbedsAdmin(auth.session.codigoCuenta);
    return NextResponse.json({ reports: reports.map(toDto) });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los reportes.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.error;

  let descripcion = "";
  let embedUrl = "";
  try {
    const body = (await request.json()) as {
      descripcion?: string;
      embedUrl?: string;
    };
    descripcion = body.descripcion?.trim() || "";
    embedUrl = body.embedUrl?.trim() || "";
  } catch {
    return NextResponse.json({ message: "Cuerpo inválido." }, { status: 400 });
  }

  try {
    const created = await createCuentaReporteEmbed({
      codigoCuenta: auth.session.codigoCuenta,
      descripcion,
      embedUrl,
    });
    return NextResponse.json({ report: toDto(created) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el reporte.",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.error;

  let id = "";
  let descripcion = "";
  let embedUrl = "";
  let estaActivo = true;
  try {
    const body = (await request.json()) as {
      id?: string;
      descripcion?: string;
      embedUrl?: string;
      estaActivo?: boolean;
    };
    id = body.id?.trim() || "";
    descripcion = body.descripcion?.trim() || "";
    embedUrl = body.embedUrl?.trim() || "";
    estaActivo = body.estaActivo !== false;
  } catch {
    return NextResponse.json({ message: "Cuerpo inválido." }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json(
      { message: "El reporte es requerido." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateCuentaReporteEmbed({
      codigoCuenta: auth.session.codigoCuenta,
      idCuentaReporteEmbed: id,
      descripcion,
      embedUrl,
      estaActivo,
    });
    return NextResponse.json({ report: toDto(updated) });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el reporte.",
      },
      { status: 400 },
    );
  }
}
