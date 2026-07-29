import { NextResponse } from "next/server";
import {
  EMBED_REPORT_TOKEN_TTL_MS,
  mintEmbedReportToken,
} from "@/lib/security/embed-report-token";
import {
  extractBearerToken,
  getCuentaReporteEmbedUrl,
  listCuentaReporteEmbeds,
  resolveEmbedReportSession,
} from "@/modules/admin-panel/inventario-mercancia/services/cuenta-reporte-embed.server";

/**
 * GET — ¿la cuenta de la sesión tiene reportes embebidos activos?
 * POST — emite token de vista (12 h) y URL enmascarada `/reportes-embed/view?t=`.
 *
 * Fuera de `/api` para no pasar por el rewrite hacia Nest.
 */
export async function GET(request: Request) {
  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ eligible: false, reports: [] }, { status: 401 });
  }

  const session = await resolveEmbedReportSession(accessToken);
  if (!session) {
    return NextResponse.json({ eligible: false, reports: [] }, { status: 401 });
  }

  const reports = await listCuentaReporteEmbeds(session.codigoCuenta);
  return NextResponse.json({
    eligible: reports.length > 0,
    codigoCuenta: session.codigoCuenta,
    reports: reports.map((row) => ({
      id: row.idCuentaReporteEmbed,
      descripcion: row.descripcion,
      reporteId: row.reporteId,
    })),
  });
}

export async function POST(request: Request) {
  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ message: "Sesión requerida." }, { status: 401 });
  }

  const session = await resolveEmbedReportSession(accessToken);
  if (!session) {
    return NextResponse.json({ message: "Sesión inválida." }, { status: 401 });
  }

  let idCuentaReporteEmbed = "";
  try {
    const body = (await request.json()) as {
      idCuentaReporteEmbed?: string;
      id?: string;
    };
    idCuentaReporteEmbed =
      body.idCuentaReporteEmbed?.trim() || body.id?.trim() || "";
  } catch {
    idCuentaReporteEmbed = "";
  }

  if (!idCuentaReporteEmbed) {
    return NextResponse.json(
      { message: "idCuentaReporteEmbed es requerido." },
      { status: 400 },
    );
  }

  const embedUrl = await getCuentaReporteEmbedUrl(
    session.codigoCuenta,
    idCuentaReporteEmbed,
  );
  if (!embedUrl) {
    return NextResponse.json(
      { message: "Esta cuenta no tiene ese reporte embebido configurado." },
      { status: 403 },
    );
  }

  const token = mintEmbedReportToken(
    session.codigoCuenta,
    idCuentaReporteEmbed,
  );
  const expiresAt = new Date(Date.now() + EMBED_REPORT_TOKEN_TTL_MS).toISOString();
  const viewPath = `/reportes-embed/view?t=${encodeURIComponent(token)}`;

  return NextResponse.json({
    viewUrl: viewPath,
    expiresAt,
    ttlSeconds: Math.floor(EMBED_REPORT_TOKEN_TTL_MS / 1000),
  });
}
