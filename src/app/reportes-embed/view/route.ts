import { NextResponse } from "next/server";
import { verifyEmbedReportToken } from "@/lib/security/embed-report-token";
import { getCuentaReporteEmbedUrl } from "@/modules/admin-panel/inventario-mercancia/services/cuenta-reporte-embed.server";

function htmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function errorPage(message: string, status: number): NextResponse {
  const body = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><title>Reporte no disponible</title></head>
<body style="margin:0;background:#020609;color:#f8f8f6;font-family:system-ui;display:grid;place-items:center;min-height:100vh">
  <p>${htmlEscape(message)}</p>
</body>
</html>`;
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
}

/**
 * Vista enmascarada: valida token corto y sirve HTML con iframe a Looker.
 * Ruta fuera de `/api` para no ser proxyada a Nest.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t")?.trim() ?? "";
  if (!token) {
    return errorPage("Token de reporte requerido.", 400);
  }

  const payload = verifyEmbedReportToken(token);
  if (!payload) {
    return errorPage("El enlace del reporte expiró o no es válido.", 401);
  }

  const embedUrl = await getCuentaReporteEmbedUrl(payload.c, payload.r);
  if (!embedUrl) {
    return errorPage("Reporte no configurado para esta cuenta.", 403);
  }

  const safeSrc = htmlEscape(embedUrl);
  const body = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Reportes</title>
  <style>
    html, body { margin: 0; height: 100%; background: #020609; }
    iframe { display: block; width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <iframe
    title="Reportes bodega externa"
    src="${safeSrc}"
    allowfullscreen
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"
  ></iframe>
</body>
</html>`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}
