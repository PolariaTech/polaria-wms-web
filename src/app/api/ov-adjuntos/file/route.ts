import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OV_ADJUNTOS_BUCKET } from "@/lib/supabase/upload-ov-adjunto";
import { buildEmlInlineHtml } from "@/modules/sales/ordenes/utils/origen/eml-attachments";
import {
  isEmlOrigenAdjunto,
  isHtmlOrigenAdjunto,
  resolveAdjuntoContentType,
} from "@/modules/sales/ordenes/utils/origen/origen-adjunto-content-type";

export const runtime = "nodejs";

/**
 * Entrega un adjunto de OV desde Supabase Storage (inline o attachment).
 * Query: path, nombre?, disposition=inline|attachment
 * REQ-159: HTML/EML en inline se sirven legibles (no descarga forzada).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const path = String(searchParams.get("path") ?? "").trim();
  const nombre = String(searchParams.get("nombre") ?? "").trim() || "adjunto";
  const dispositionRaw = String(searchParams.get("disposition") ?? "inline")
    .trim()
    .toLowerCase();
  const disposition =
    dispositionRaw === "attachment" ? "attachment" : "inline";

  if (!path || path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ error: "path inválido." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Storage no configurado." },
      { status: 503 },
    );
  }

  const { data, error } = await admin.storage
    .from(OV_ADJUNTOS_BUCKET)
    .download(path);

  if (error || !data) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "No se encontró el archivo (¿fue subido a Supabase Storage?).",
      },
      { status: 404 },
    );
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const safeName = nombre.replace(/[/\\"]/g, "_");
  const storedMime = data.type || null;

  // REQ-159: .eml con ojo → página legible (asunto, de/para, cuerpo).
  if (disposition === "inline" && isEmlOrigenAdjunto({ nombre, mime: storedMime })) {
    try {
      const html = await buildEmlInlineHtml(buffer);
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": String(Buffer.byteLength(html, "utf8")),
          "Content-Disposition": `inline; filename="${safeName.replace(/\.eml$/i, ".html")}"`,
          "Cache-Control": "private, max-age=60",
          "Content-Security-Policy":
            "default-src 'none'; img-src data: https: http:; style-src 'unsafe-inline'; font-src data:;",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (err: unknown) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "No se pudo leer el correo (.eml).",
        },
        { status: 422 },
      );
    }
  }

  const contentType = resolveAdjuntoContentType(nombre, storedMime);
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Length": String(buffer.length),
    "Content-Disposition": `${disposition}; filename="${safeName}"`,
    "Cache-Control": "private, max-age=60",
    "X-Content-Type-Options": "nosniff",
  };

  // REQ-159: HTML inline — el navegador lo pinta; sin scripts.
  if (disposition === "inline" && isHtmlOrigenAdjunto({ nombre, mime: storedMime })) {
    headers["Content-Type"] = "text/html; charset=utf-8";
    headers["Content-Security-Policy"] =
      "default-src 'none'; img-src data: https: http:; style-src 'unsafe-inline'; font-src data:;";
  }

  return new NextResponse(buffer, {
    status: 200,
    headers,
  });
}
